<template>
  <main class="course-class-page">
    <header class="page-header">
      <h1>教学班管理</h1>

      <div class="header-actions">
        <span class="total">共 {{ total }} 条</span>

        <button type="button" class="primary-button" @click="openCreate">新增教学班</button>
      </div>
    </header>

    <p v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </p>

    <section v-if="formVisible" class="form-panel">
      <h2>{{ editingId ? '编辑教学班' : '新增教学班' }}</h2>

      <form class="course-class-form" @submit.prevent="handleSubmit">
        <label>
          <span>课程</span>
          <select v-model="form.courseId" :disabled="saving">
            <option value="">请选择课程</option>
            <option v-for="course in courseOptions" :key="course.id" :value="course.id">
              {{ course.courseCode }} - {{ course.courseName }}
            </option>
          </select>
        </label>

        <label>
          <span>学期</span>
          <select v-model="form.semesterId" :disabled="saving">
            <option value="">请选择学期</option>
            <option v-for="semester in semesterOptions" :key="semester.id" :value="semester.id">
              {{ semester.semesterName }}
            </option>
          </select>
        </label>

        <label>
          <span>授课教师</span>
          <select v-model="form.teacherId" :disabled="saving">
            <option value="">请选择教师</option>
            <option v-for="teacher in teacherOptions" :key="teacher.id" :value="teacher.id">
              {{ teacher.teacherNo }} - {{ teacher.title }}
            </option>
          </select>
        </label>

        <label>
          <span>教学班名称</span>
          <input
            v-model.trim="form.className"
            type="text"
            placeholder="例如 软件工程 1 班"
            :disabled="saving"
          />
        </label>

        <label>
          <span>平时成绩权重</span>
          <input
            v-model.number="form.usualWeight"
            type="number"
            min="0"
            max="1"
            step="0.1"
            :disabled="saving"
          />
        </label>

        <label>
          <span>考试成绩权重</span>
          <input
            v-model.number="form.examWeight"
            type="number"
            min="0"
            max="1"
            step="0.1"
            :disabled="saving"
          />
        </label>

        <label>
          <span>状态</span>
          <select v-model="form.status" :disabled="saving">
            <option value="ACTIVE">启用</option>
            <option value="INACTIVE">停用</option>
          </select>
        </label>

        <p class="weight-hint">
          当前权重合计：
          {{ (form.usualWeight + form.examWeight).toFixed(2) }}
        </p>

        <p v-if="formErrorMessage" class="form-error">
          {{ formErrorMessage }}
        </p>

        <div class="form-actions">
          <button type="submit" class="primary-button" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>

          <button type="button" class="secondary-button" :disabled="saving" @click="closeForm">
            取消
          </button>
        </div>
      </form>
    </section>

    <section class="table-panel">
      <table>
        <thead>
          <tr>
            <th>课程</th>
            <th>学期</th>
            <th>授课教师</th>
            <th>教学班</th>
            <th>平时权重</th>
            <th>考试权重</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="8" class="empty-cell">正在加载...</td>
          </tr>

          <template v-else>
            <tr v-if="courseClassList.length === 0">
              <td colspan="8" class="empty-cell">暂无教学班数据</td>
            </tr>

            <tr v-for="courseClass in courseClassList" :key="courseClass.id">
              <td>{{ courseLabel(courseClass.courseId) }}</td>
              <td>{{ semesterLabel(courseClass.semesterId) }}</td>
              <td>{{ teacherLabel(courseClass.teacherId) }}</td>
              <td>{{ courseClass.className }}</td>
              <td>{{ formatWeight(courseClass.usualWeight) }}</td>
              <td>{{ formatWeight(courseClass.examWeight) }}</td>
              <td>
                <span class="status-tag" :class="courseClass.status.toLowerCase()">
                  {{ statusText(courseClass.status) }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button type="button" class="edit-button" @click="openEdit(courseClass)">
                    编辑
                  </button>

                  <button type="button" class="danger-button" @click="handleRemove(courseClass)">
                    删除
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <footer class="pagination">
        <button type="button" :disabled="current <= 1 || loading" @click="handlePrevious">
          上一页
        </button>

        <span>第 {{ current }} 页</span>

        <button type="button" :disabled="current * size >= total || loading" @click="handleNext">
          下一页
        </button>
      </footer>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import {
  courseClassApi,
  type CourseClass,
  type CourseClassForm,
  type CourseClassStatus,
} from '@/api/courseClass'
import { courseApi, type Course } from '@/api/course'
import { semesterApi, type Semester } from '@/api/semester'
import { teacherApi, type Teacher } from '@/api/teacher'
import { getApiErrorMessage } from '@/utils/apiError'

defineOptions({ name: 'CourseClassListView' })

const loading = ref(false)
const errorMessage = ref('')
const courseClassList = ref<CourseClass[]>([])
const total = ref(0)
const current = ref(1)
const size = ref(10)

const courseOptions = ref<Course[]>([])
const semesterOptions = ref<Semester[]>([])
const teacherOptions = ref<Teacher[]>([])

const formVisible = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const formErrorMessage = ref('')

const form = ref<CourseClassForm>(createEmptyForm())

const courseMap = computed(() => {
  return new Map(
    courseOptions.value.map((course) => [course.id, `${course.courseCode} - ${course.courseName}`]),
  )
})

const semesterMap = computed(() => {
  return new Map(semesterOptions.value.map((semester) => [semester.id, semester.semesterName]))
})

const teacherMap = computed(() => {
  return new Map(
    teacherOptions.value.map((teacher) => [teacher.id, `${teacher.teacherNo} - ${teacher.title}`]),
  )
})

function createEmptyForm(): CourseClassForm {
  return {
    courseId: '',
    semesterId: '',
    teacherId: '',
    className: '',
    usualWeight: 0.4,
    examWeight: 0.6,
    status: 'ACTIVE',
  }
}

async function loadOptions() {
  try {
    const [courseResponse, semesterResponse, teacherResponse] = await Promise.all([
      courseApi.list(),
      semesterApi.list(),
      teacherApi.list(),
    ])

    const courseResult = courseResponse.data
    const semesterResult = semesterResponse.data
    const teacherResult = teacherResponse.data

    if (courseResult.code !== 200) {
      throw new Error(courseResult.message)
    }

    if (semesterResult.code !== 200) {
      throw new Error(semesterResult.message)
    }

    if (teacherResult.code !== 200) {
      throw new Error(teacherResult.message)
    }

    courseOptions.value = courseResult.data
    semesterOptions.value = semesterResult.data
    teacherOptions.value = teacherResult.data
  } catch (error) {
    console.error(error)
    errorMessage.value = getApiErrorMessage(error, '课程、学期或教师选项加载失败')
  }
}

async function loadCourseClasses() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await courseClassApi.page({
      current: current.value,
      size: size.value,
    })

    const result = response.data

    if (result.code !== 200) {
      errorMessage.value = result.message
      return
    }

    const pageData = result.data

    courseClassList.value = pageData.records
    total.value = pageData.total
  } catch (error) {
    console.error(error)
    errorMessage.value = getApiErrorMessage(error, '教学班列表加载失败，请检查后端服务')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = createEmptyForm()
  formErrorMessage.value = ''
  formVisible.value = true
}

function openEdit(courseClass: CourseClass) {
  editingId.value = courseClass.id
  form.value = {
    courseId: courseClass.courseId,
    semesterId: courseClass.semesterId,
    teacherId: courseClass.teacherId,
    className: courseClass.className,
    usualWeight: courseClass.usualWeight,
    examWeight: courseClass.examWeight,
    status: courseClass.status,
  }
  formErrorMessage.value = ''
  formVisible.value = true
}

function closeForm() {
  editingId.value = null
  form.value = createEmptyForm()
  formErrorMessage.value = ''
  formVisible.value = false
}

async function handleSubmit() {
  formErrorMessage.value = ''

  if (!form.value.courseId) {
    formErrorMessage.value = '请选择课程'
    return
  }

  if (!form.value.semesterId) {
    formErrorMessage.value = '请选择学期'
    return
  }

  if (!form.value.teacherId) {
    formErrorMessage.value = '请选择授课教师'
    return
  }

  if (!form.value.className) {
    formErrorMessage.value = '请输入教学班名称'
    return
  }

  const usualWeight = Number(form.value.usualWeight)
  const examWeight = Number(form.value.examWeight)
  const weightTotal = usualWeight + examWeight

  if (usualWeight < 0 || usualWeight > 1) {
    formErrorMessage.value = '平时成绩权重必须在 0 到 1 之间'
    return
  }

  if (examWeight < 0 || examWeight > 1) {
    formErrorMessage.value = '考试成绩权重必须在 0 到 1 之间'
    return
  }

  if (Math.abs(weightTotal - 1) > 0.0001) {
    formErrorMessage.value = '平时成绩权重和考试成绩权重之和必须等于 1'
    return
  }

  saving.value = true

  try {
    const response = editingId.value
      ? await courseClassApi.update({
          id: editingId.value,
          ...form.value,
          usualWeight,
          examWeight,
        })
      : await courseClassApi.create({
          ...form.value,
          usualWeight,
          examWeight,
        })

    const result = response.data

    if (result.code !== 200) {
      formErrorMessage.value = result.message
      return
    }

    closeForm()
    await loadCourseClasses()
  } catch (error) {
    console.error(error)
    formErrorMessage.value = getApiErrorMessage(
      error,
      editingId.value ? '修改教学班失败' : '新增教学班失败',
    )
  } finally {
    saving.value = false
  }
}

async function handleRemove(courseClass: CourseClass) {
  const confirmed = window.confirm(`确定删除教学班“${courseClass.className}”吗？`)

  if (!confirmed) {
    return
  }

  try {
    const response = await courseClassApi.remove(courseClass.id)
    const result = response.data

    if (result.code !== 200) {
      errorMessage.value = result.message
      return
    }

    if (courseClassList.value.length === 1 && current.value > 1) {
      current.value -= 1
    }

    await loadCourseClasses()
  } catch (error) {
    console.error(error)
    errorMessage.value = getApiErrorMessage(error, '删除教学班失败')
  }
}

async function handlePrevious() {
  if (current.value <= 1) {
    return
  }

  current.value -= 1
  await loadCourseClasses()
}

async function handleNext() {
  if (current.value * size.value >= total.value) {
    return
  }

  current.value += 1
  await loadCourseClasses()
}

function courseLabel(courseId: string) {
  return courseMap.value.get(courseId) ?? courseId
}

function semesterLabel(semesterId: string) {
  return semesterMap.value.get(semesterId) ?? semesterId
}

function teacherLabel(teacherId: string) {
  return teacherMap.value.get(teacherId) ?? teacherId
}

function statusText(status: CourseClassStatus) {
  return status === 'ACTIVE' ? '启用' : '停用'
}

function formatWeight(weight: number) {
  return `${(weight * 100).toFixed(0)}%`
}

onMounted(async () => {
  await loadOptions()
  await loadCourseClasses()
})
</script>

<style scoped>
.course-class-page {
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.total {
  color: #64748b;
}

.error-message {
  margin: 0;
  padding: 12px 14px;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #fef2f2;
  color: #b91c1c;
}

.form-panel {
  padding: 22px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

.form-panel h2 {
  margin: 0 0 18px;
  color: #1f2937;
  font-size: 18px;
}

.course-class-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.course-class-form label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: #334155;
}

.course-class-form input,
.course-class-form select {
  width: 100%;
  height: 40px;
  padding: 0 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: white;
  color: #1f2937;
  outline: none;
}

.course-class-form input:focus,
.course-class-form select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgb(37 99 235 / 12%);
}

.course-class-form input:disabled,
.course-class-form select:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
}

.weight-hint {
  margin: 0;
  color: #64748b;
}

.form-error {
  grid-column: 1 / -1;
  margin: 0;
  color: #dc2626;
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.primary-button,
.secondary-button,
.edit-button {
  height: 36px;
  padding: 0 13px;
  border-radius: 6px;
  cursor: pointer;
}

.primary-button {
  border: 0;
  background: #2563eb;
  color: white;
}

.primary-button:hover {
  background: #1d4ed8;
}

.primary-button:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.secondary-button,
.edit-button {
  border: 1px solid #cbd5e1;
  background: white;
  color: #334155;
}

.secondary-button:hover,
.edit-button:hover {
  background: #f8fafc;
}

.table-panel {
  overflow: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

table {
  width: 100%;
  min-width: 1120px;
  border-collapse: collapse;
}

th,
td {
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  white-space: nowrap;
}

th {
  background: #f8fafc;
  color: #475569;
  font-size: 14px;
}

td {
  color: #334155;
  font-size: 15px;
}

.empty-cell {
  padding: 42px;
  text-align: center;
  color: #94a3b8;
}

.status-tag {
  display: inline-block;
  padding: 4px 9px;
  border-radius: 5px;
  font-size: 13px;
}

.status-tag.active {
  background: #ecfdf5;
  color: #15803d;
}

.status-tag.inactive {
  background: #f1f5f9;
  color: #64748b;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.danger-button {
  height: 36px;
  padding: 0 12px;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #fff;
  color: #dc2626;
  cursor: pointer;
}

.danger-button:hover {
  background: #fef2f2;
}

.pagination {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  background: #f8fafc;
}

.pagination button {
  height: 34px;
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  background: white;
  color: #334155;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 1080px) {
  .course-class-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .course-class-form {
    grid-template-columns: 1fr;
  }
}
</style>
