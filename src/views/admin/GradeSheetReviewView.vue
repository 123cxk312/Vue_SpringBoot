<template>
  <main class="review-page">
    <header class="page-header">
      <h1>成绩审核</h1>
    </header>

    <p v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </p>

    <p v-if="actionMessage" class="success-message">
      {{ actionMessage }}
    </p>

    <section class="toolbar-panel">
      <label>
        <span>选择教学班</span>
        <select
          v-model="selectedCourseClassId"
          :disabled="optionsLoading || sheetLoading"
          @change="loadGradeSheet"
        >
          <option value="">请选择教学班</option>
          <option
            v-for="courseClass in courseClassOptions"
            :key="courseClass.id"
            :value="courseClass.id"
          >
            {{ courseClassLabel(courseClass.id) }}
          </option>
        </select>
      </label>
    </section>

    <section v-if="!selectedCourseClassId" class="empty-panel">请先选择教学班</section>

    <template v-else-if="gradeSheet">
      <section class="summary-panel">
        <div>
          <p class="summary-label">教学班</p>
          <p class="summary-value">
            {{ courseClassLabel(gradeSheet.courseClassId) }}
          </p>
        </div>

        <div>
          <p class="summary-label">成绩单状态</p>
          <span class="status-tag" :class="gradeSheet.status.toLowerCase()">
            {{ statusText(gradeSheet.status) }}
          </span>
        </div>

        <div>
          <p class="summary-label">平时成绩权重</p>
          <p class="summary-value">
            {{ formatWeight(gradeSheet.usualWeight) }}
          </p>
        </div>

        <div>
          <p class="summary-label">考试成绩权重</p>
          <p class="summary-value">
            {{ formatWeight(gradeSheet.examWeight) }}
          </p>
        </div>
      </section>

      <section class="table-panel">
        <table>
          <thead>
            <tr>
              <th>学号</th>
              <th>姓名</th>
              <th>平时成绩</th>
              <th>考试成绩</th>
              <th>最终成绩</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="sheetLoading">
              <td colspan="5" class="empty-cell">正在加载...</td>
            </tr>

            <tr v-else-if="gradeSheet.rows.length === 0">
              <td colspan="5" class="empty-cell">暂无成绩数据</td>
            </tr>

            <tr v-for="row in gradeSheet.rows" :key="row.studentId">
              <td>{{ row.studentNo }}</td>
              <td>{{ row.realName }}</td>
              <td>{{ formatScore(row.usualScore) }}</td>
              <td>{{ formatScore(row.examScore) }}</td>
              <td class="final-score">
                {{ formatScore(row.finalScore) }}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="action-panel">
        <template v-if="gradeSheet.status === 'SUBMITTED'">
          <label class="comment-field">
            <span>退回原因</span>
            <textarea
              v-model.trim="returnComment"
              rows="3"
              placeholder="退回时请填写原因"
              :disabled="submitting"
            />
          </label>

          <div class="action-buttons">
            <button
              type="button"
              class="primary-button"
              :disabled="submitting"
              @click="handleReview"
            >
              审核通过
            </button>

            <button
              type="button"
              class="danger-button"
              :disabled="submitting"
              @click="handleReturn"
            >
              退回成绩单
            </button>
          </div>
        </template>

        <template v-else-if="gradeSheet.status === 'REVIEWED'">
          <p class="workflow-hint">成绩单已审核通过，可以发布成绩。</p>

          <button
            type="button"
            class="primary-button"
            :disabled="submitting"
            @click="handlePublish"
          >
            {{ submitting ? '发布中...' : '发布成绩' }}
          </button>
        </template>

        <template v-else-if="gradeSheet.status === 'PUBLISHED'">
          <p class="workflow-hint">成绩已经发布，当前成绩单已锁定。</p>
        </template>

        <template v-else>
          <p class="workflow-hint">当前成绩单尚未提交，等待教师录入并提交成绩。</p>
        </template>
      </section>

      <section class="log-panel">
        <h2>操作日志</h2>

        <p v-if="logs.length === 0" class="empty-log">暂无操作日志</p>

        <ol v-else class="log-list">
          <li v-for="log in logs" :key="log.id">
            <div class="log-head">
              <strong>{{ log.action }}</strong>
              <span>{{ formatDate(log.createdAt) }}</span>
            </div>

            <p>操作人：{{ log.operatorId }}</p>

            <p>
              状态：
              {{ log.beforeStatus ?? '无' }}
              ->
              {{ log.afterStatus ?? '无' }}
            </p>

            <p v-if="log.remark">备注：{{ log.remark }}</p>
          </li>
        </ol>
      </section>
    </template>
  </main>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { courseApi, type Course } from '@/api/course'
import { semesterApi, type Semester } from '@/api/semester'
import { courseClassApi, type CourseClass } from '@/api/courseClass'
import {
  gradeSheetApi,
  type GradeOperationLog,
  type GradeSheetDetail,
  type GradeSheetStatus,
} from '@/api/gradeSheet'
import { getApiErrorMessage } from '@/utils/apiError'

defineOptions({ name: 'GradeSheetReviewView' })

const optionsLoading = ref(false)
const sheetLoading = ref(false)
const submitting = ref(false)

const errorMessage = ref('')
const actionMessage = ref('')

const selectedCourseClassId = ref('')
const returnComment = ref('')

const courseOptions = ref<Course[]>([])
const semesterOptions = ref<Semester[]>([])
const courseClassOptions = ref<CourseClass[]>([])

const gradeSheet = ref<GradeSheetDetail | null>(null)
const logs = ref<GradeOperationLog[]>([])

const courseMap = computed(() => {
  return new Map<string, string>(
    courseOptions.value.map(
      (course) => [course.id, `${course.courseCode} - ${course.courseName}`] as const,
    ),
  )
})

const semesterMap = computed(() => {
  return new Map<string, string>(
    semesterOptions.value.map((semester) => [semester.id, semester.semesterName] as const),
  )
})

const courseClassMap = computed(() => {
  return new Map<string, CourseClass>(
    courseClassOptions.value.map((courseClass) => [courseClass.id, courseClass] as const),
  )
})

async function loadOptions() {
  optionsLoading.value = true
  errorMessage.value = ''

  try {
    const [courseResponse, semesterResponse, courseClassResponse] = await Promise.all([
      courseApi.list(),
      semesterApi.list(),
      courseClassApi.list(),
    ])

    const courseResult = courseResponse.data
    const semesterResult = semesterResponse.data
    const courseClassResult = courseClassResponse.data

    if (courseResult.code !== 200) {
      throw new Error(courseResult.message)
    }

    if (semesterResult.code !== 200) {
      throw new Error(semesterResult.message)
    }

    if (courseClassResult.code !== 200) {
      throw new Error(courseClassResult.message)
    }

    courseOptions.value = courseResult.data
    semesterOptions.value = semesterResult.data
    courseClassOptions.value = courseClassResult.data
  } catch (error) {
    console.error(error)
    errorMessage.value = getApiErrorMessage(error, '成绩审核选项加载失败')
  } finally {
    optionsLoading.value = false
  }
}

async function loadGradeSheet() {
  actionMessage.value = ''
  errorMessage.value = ''
  returnComment.value = ''

  if (!selectedCourseClassId.value) {
    gradeSheet.value = null
    logs.value = []
    return
  }

  sheetLoading.value = true

  try {
    const detailResponse = await gradeSheetApi.detailByCourseClass(selectedCourseClassId.value)

    const detailResult = detailResponse.data

    if (detailResult.code !== 200) {
      throw new Error(detailResult.message)
    }

    gradeSheet.value = detailResult.data

    const logResponse = await gradeSheetApi.logs(gradeSheet.value.id)

    const logResult = logResponse.data

    if (logResult.code !== 200) {
      throw new Error(logResult.message)
    }

    logs.value = logResult.data
  } catch (error) {
    console.error(error)
    gradeSheet.value = null
    logs.value = []
    errorMessage.value = getApiErrorMessage(error, '成绩单加载失败')
  } finally {
    sheetLoading.value = false
  }
}

async function reloadAfterAction() {
  await loadGradeSheet()
}

async function handleReview() {
  if (!gradeSheet.value) {
    return
  }

  const confirmed = window.confirm('确认审核通过该成绩单吗？')

  if (!confirmed) {
    return
  }

  submitting.value = true

  try {
    const response = await gradeSheetApi.review(gradeSheet.value.id)

    const result = response.data

    if (result.code !== 200) {
      errorMessage.value = result.message
      return
    }

    actionMessage.value = '成绩单已审核通过'
    await reloadAfterAction()
  } catch (error) {
    console.error(error)
    errorMessage.value = getApiErrorMessage(error, '审核成绩单失败')
  } finally {
    submitting.value = false
  }
}

async function handleReturn() {
  if (!gradeSheet.value) {
    return
  }

  if (!returnComment.value) {
    errorMessage.value = '退回成绩单时必须填写原因'
    return
  }

  submitting.value = true

  try {
    const response = await gradeSheetApi.returnSheet(gradeSheet.value.id, {
      comment: returnComment.value,
    })

    const result = response.data

    if (result.code !== 200) {
      errorMessage.value = result.message
      return
    }

    actionMessage.value = '成绩单已退回'
    await reloadAfterAction()
  } catch (error) {
    console.error(error)
    errorMessage.value = getApiErrorMessage(error, '退回成绩单失败')
  } finally {
    submitting.value = false
  }
}

async function handlePublish() {
  if (!gradeSheet.value) {
    return
  }

  const confirmed = window.confirm('成绩发布后将锁定，确认发布吗？')

  if (!confirmed) {
    return
  }

  submitting.value = true

  try {
    const response = await gradeSheetApi.publish(gradeSheet.value.id)

    const result = response.data

    if (result.code !== 200) {
      errorMessage.value = result.message
      return
    }

    actionMessage.value = '成绩已经发布'
    await reloadAfterAction()
  } catch (error) {
    console.error(error)
    errorMessage.value = getApiErrorMessage(error, '发布成绩失败')
  } finally {
    submitting.value = false
  }
}

function courseClassLabel(courseClassId: string) {
  const courseClass = courseClassMap.value.get(courseClassId)

  if (!courseClass) {
    return courseClassId
  }

  const courseName = courseMap.value.get(courseClass.courseId) ?? courseClass.courseId

  const semesterName = semesterMap.value.get(courseClass.semesterId) ?? courseClass.semesterId

  return `${courseName} / ${semesterName} / ${courseClass.className}`
}

function statusText(status: GradeSheetStatus) {
  const statusMap: Record<GradeSheetStatus, string> = {
    DRAFT: '草稿',
    SUBMITTED: '待审核',
    RETURNED: '已退回',
    REVIEWED: '已审核',
    PUBLISHED: '已发布',
  }

  return statusMap[status]
}

function formatWeight(weight: number) {
  return `${(weight * 100).toFixed(0)}%`
}

function formatScore(score: number | null) {
  if (score === null || score === undefined) {
    return '-'
  }

  return score.toFixed(2)
}

function formatDate(value: string) {
  if (!value) {
    return '-'
  }

  return value.replace('T', ' ').slice(0, 19)
}

onMounted(() => {
  loadOptions()
})
</script>

<style scoped>
.review-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-header h1 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
}

.error-message,
.success-message {
  margin: 0;
  padding: 12px 14px;
  border-radius: 6px;
}

.error-message {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.success-message {
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}

.toolbar-panel,
.summary-panel,
.action-panel,
.log-panel,
.empty-panel {
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

.toolbar-panel {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-panel label {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #334155;
}

.toolbar-panel select {
  min-width: 520px;
  height: 40px;
  padding: 0 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: white;
}

.summary-panel {
  display: grid;
  grid-template-columns: 2fr repeat(3, 1fr);
  gap: 20px;
}

.summary-label {
  margin: 0 0 8px;
  color: #64748b;
  font-size: 13px;
}

.summary-value {
  margin: 0;
  color: #1f2937;
  font-weight: 600;
}

.status-tag {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 13px;
}

.status-tag.draft {
  background: #f1f5f9;
  color: #475569;
}
.status-tag.submitted {
  background: #fff7ed;
  color: #c2410c;
}
.status-tag.returned {
  background: #fef2f2;
  color: #b91c1c;
}
.status-tag.reviewed {
  background: #eff6ff;
  color: #2563eb;
}
.status-tag.published {
  background: #ecfdf5;
  color: #15803d;
}

.table-panel {
  overflow: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
}

th,
td {
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
}

th {
  background: #f8fafc;
  color: #475569;
  font-size: 14px;
}

td {
  color: #334155;
}

.final-score {
  color: #2563eb;
  font-weight: 700;
}

.empty-cell {
  padding: 42px;
  text-align: center;
  color: #94a3b8;
}

.action-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #334155;
}

.comment-field textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  resize: vertical;
  outline: none;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.primary-button,
.danger-button {
  height: 38px;
  padding: 0 14px;
  border-radius: 6px;
  cursor: pointer;
}

.primary-button {
  border: 0;
  background: #2563eb;
  color: white;
}

.danger-button {
  border: 1px solid #fecaca;
  background: white;
  color: #dc2626;
}

.primary-button:disabled,
.danger-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.workflow-hint {
  margin: 0;
  color: #64748b;
}

.log-panel h2 {
  margin: 0 0 16px;
  font-size: 18px;
}

.log-list {
  margin: 0;
  padding-left: 22px;
}

.log-list li {
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
}

.log-head {
  display: flex;
  justify-content: space-between;
  color: #334155;
}

.log-list p {
  margin: 8px 0 0;
  color: #64748b;
}

.empty-log,
.empty-panel {
  color: #64748b;
}

@media (max-width: 860px) {
  .summary-panel {
    grid-template-columns: 1fr 1fr;
  }

  .toolbar-panel label {
    align-items: stretch;
    flex-direction: column;
  }

  .toolbar-panel select {
    width: 100%;
    min-width: 0;
  }
}
</style>
