<template>
  <main class="grade-entry-page">
    <header class="page-header">
      <div>
        <h1>成绩录入</h1>
        <p class="subtitle">教学班 ID：{{ courseClassId }}</p>
      </div>

      <RouterLink class="back-link" to="/teacher/course-classes"> 返回我的教学班 </RouterLink>
    </header>

    <p v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </p>

    <p v-if="successMessage" class="success-message">
      {{ successMessage }}
    </p>

    <section v-if="loading" class="empty-panel">正在加载成绩单...</section>

    <template v-else-if="gradeSheet">
      <section class="summary-panel">
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

        <div>
          <p class="summary-label">学生人数</p>
          <p class="summary-value">
            {{ gradeSheet.rows.length }}
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
            <tr v-if="gradeSheet.rows.length === 0">
              <td colspan="5" class="empty-cell">当前教学班没有学生</td>
            </tr>

            <tr v-for="row in gradeSheet.rows" :key="row.studentId">
              <td>{{ row.studentNo }}</td>
              <td>{{ row.realName }}</td>
              <td>
                <input
                  v-model.number="row.usualScore"
                  class="score-input"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  :disabled="!editable || saving || submitting"
                />
              </td>
              <td>
                <input
                  v-model.number="row.examScore"
                  class="score-input"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  :disabled="!editable || saving || submitting"
                />
              </td>
              <td class="final-score">
                {{ finalDisplay(row) }}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="action-panel">
        <template v-if="editable">
          <button
            type="button"
            class="secondary-button"
            :disabled="saving || submitting"
            @click="handleSave"
          >
            {{ saving ? '保存中...' : '保存草稿' }}
          </button>

          <button
            type="button"
            class="primary-button"
            :disabled="saving || submitting"
            @click="handleSubmit"
          >
            {{ submitting ? '提交中...' : '提交成绩单' }}
          </button>
        </template>

        <p v-else class="locked-message">
          当前状态为“{{ statusText(gradeSheet.status) }}”， 成绩已经锁定，不能修改。
        </p>
      </section>
    </template>
  </main>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  gradeSheetApi,
  type GradeSheetDetail,
  type GradeSheetStatus,
  type ScoreRow,
} from '@/api/gradeSheet'
import { getApiErrorMessage } from '@/utils/apiError'

defineOptions({ name: 'GradeEntryView' })

const route = useRoute()

const courseClassId = route.params.courseClassId as string

const loading = ref(false)
const saving = ref(false)
const submitting = ref(false)

const errorMessage = ref('')
const successMessage = ref('')

const gradeSheet = ref<GradeSheetDetail | null>(null)

const editable = computed(() => {
  return gradeSheet.value?.status === 'DRAFT' || gradeSheet.value?.status === 'RETURNED'
})

async function loadGradeSheet() {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await gradeSheetApi.detailByCourseClass(courseClassId)

    const result = response.data

    if (result.code !== 200) {
      errorMessage.value = result.message
      return
    }

    gradeSheet.value = result.data
  } catch (error) {
    console.error(error)
    errorMessage.value = getApiErrorMessage(error, '成绩单加载失败')
  } finally {
    loading.value = false
  }
}

function normalizeScore(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const score = Number(value)

  return Number.isNaN(score) ? null : score
}

function validateScores(requireComplete: boolean): string | null {
  if (!gradeSheet.value) {
    return '成绩单不存在'
  }

  for (const row of gradeSheet.value.rows) {
    const usualScore = normalizeScore(row.usualScore)
    const examScore = normalizeScore(row.examScore)

    if (usualScore !== null && (usualScore < 0 || usualScore > 100)) {
      return `${row.studentNo} 的平时成绩必须在 0 到 100 之间`
    }

    if (examScore !== null && (examScore < 0 || examScore > 100)) {
      return `${row.studentNo} 的考试成绩必须在 0 到 100 之间`
    }

    if (requireComplete && (usualScore === null || examScore === null)) {
      return `${row.studentNo} 的成绩尚未填写完整`
    }
  }

  return null
}

async function persistScores(): Promise<boolean> {
  if (!gradeSheet.value) {
    return false
  }

  const validationMessage = validateScores(false)

  if (validationMessage) {
    //字符串是错误，null是正确
    errorMessage.value = validationMessage
    return false
  }

  const response = await gradeSheetApi.saveScores(gradeSheet.value.id, {
    scores: gradeSheet.value.rows.map((row) => ({
      studentId: row.studentId,
      usualScore: normalizeScore(row.usualScore),
      examScore: normalizeScore(row.examScore),
    })),
  })

  const result = response.data

  if (result.code !== 200) {
    errorMessage.value = result.message
    return false
  }

  gradeSheet.value = result.data
  return true
}

async function handleSave() {
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const success = await persistScores()

    if (success) {
      successMessage.value = '成绩保存成功'
    }
  } catch (error) {
    console.error(error)
    errorMessage.value = getApiErrorMessage(error, '保存成绩失败')
  } finally {
    saving.value = false
  }
}

async function handleSubmit() {
  const validationMessage = validateScores(true)

  if (validationMessage) {
    errorMessage.value = validationMessage
    return
  }

  const confirmed = window.confirm('提交后教师将不能继续修改，确认提交吗？')

  if (!confirmed) {
    return
  }

  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const saved = await persistScores()

    if (!saved || !gradeSheet.value) {
      return
    }

    const response = await gradeSheetApi.submit(gradeSheet.value.id)
    const result = response.data

    if (result.code !== 200) {
      errorMessage.value = result.message
      return
    }

    await loadGradeSheet()
    successMessage.value = '成绩单提交成功'
  } catch (error) {
    console.error(error)
    errorMessage.value = getApiErrorMessage(error, '提交成绩单失败')
  } finally {
    submitting.value = false
  }
}

function finalDisplay(row: ScoreRow) {
  const usualScore = normalizeScore(row.usualScore)
  const examScore = normalizeScore(row.examScore)

  if (usualScore === null || examScore === null || !gradeSheet.value) {
    return '-'
  }

  const finalScore =
    usualScore * gradeSheet.value.usualWeight + examScore * gradeSheet.value.examWeight

  return finalScore.toFixed(2)
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

onMounted(() => {
  loadGradeSheet()
})
</script>

<style scoped>
.grade-entry-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-header h1 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
}

.subtitle {
  margin: 8px 0 0;
  color: #64748b;
}

.back-link {
  color: #2563eb;
  text-decoration: none;
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

.empty-panel,
.summary-panel,
.action-panel {
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

.summary-panel {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
  min-width: 780px;
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

.score-input {
  width: 120px;
  height: 38px;
  padding: 0 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
}

.score-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgb(37 99 235 / 12%);
}

.score-input:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
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
  align-items: center;
  gap: 12px;
}

.primary-button,
.secondary-button {
  height: 40px;
  padding: 0 15px;
  border-radius: 6px;
  cursor: pointer;
}

.primary-button {
  border: 0;
  background: #2563eb;
  color: white;
}

.secondary-button {
  border: 1px solid #cbd5e1;
  background: white;
  color: #334155;
}

.primary-button:disabled,
.secondary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.locked-message {
  margin: 0;
  color: #64748b;
}

@media (max-width: 860px) {
  .summary-panel {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .summary-panel {
    grid-template-columns: 1fr;
  }
}
</style>
