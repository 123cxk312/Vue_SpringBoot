<template>
  <main class="enrollment-page">
    <header class="page-header">
      <h1>教学班学生名单</h1>
    </header>

    <p v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </p>

    <section class="toolbar-panel">
      <label>
        <span>选择教学班</span>
        <select v-model="selectedCourseClassId" :disabled="loading">
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

    <section v-if="selectedCourseClassId" class="enrollment-panel">
      <h2>添加学生</h2>

      <div class="enrollment-form">
        <select v-model="newStudentId" :disabled="submitting">
          <option value="">请选择学生</option>
          <option v-for="student in studentOptions" :key="student.id" :value="student.id">
            {{ studentLabel(student.id) }}
          </option>
        </select>

        <button
          type="button"
          class="primary-button"
          :disabled="submitting || !newStudentId"
          @click="handleAddStudent"
        >
          {{ submitting ? '添加中...' : '添加学生' }}
        </button>
      </div>

      <p v-if="enrollmentErrorMessage" class="form-error">
        {{ enrollmentErrorMessage }}
      </p>
    </section>

    <section v-if="selectedCourseClassId" class="table-panel">
      <table>
        <thead>
          <tr>
            <th>学号</th>
            <th>班级</th>
            <th>专业</th>
            <th>入学年级</th>
            <th>加入时间</th>
            <th>操作</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="empty-cell">正在加载...</td>
          </tr>

          <template v-else>
            <tr v-if="filteredRelations.length === 0">
              <td colspan="6" class="empty-cell">当前教学班暂无学生</td>
            </tr>

            <tr v-for="relation in filteredRelations" :key="relation.id">
              <td>{{ studentNo(relation.studentId) }}</td>
              <td>{{ studentClass(relation.studentId) }}</td>
              <td>{{ studentMajor(relation.studentId) }}</td>
              <td>{{ studentGradeYear(relation.studentId) }}</td>
              <td>{{ formatDate(relation.createdAt) }}</td>
              <td>
                <button
                  type="button"
                  class="danger-button"
                  :disabled="submitting"
                  @click="handleRemoveStudent(relation)"
                >
                  移出教学班
                </button>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </section>

    <section v-else class="empty-panel">请先选择教学班</section>
  </main>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { courseApi, type Course } from '@/api/course'
import { semesterApi, type Semester } from '@/api/semester'
import { courseClassApi, type CourseClass } from '@/api/courseClass'
import { studentApi, type Student } from '@/api/student'
import { courseClassStudentApi, type CourseClassStudent } from '@/api/courseClassStudent'
import { getApiErrorMessage } from '@/utils/apiError'

defineOptions({ name: 'CourseClassStudentListView' })

const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const enrollmentErrorMessage = ref('')

const selectedCourseClassId = ref('')
const newStudentId = ref('')

const courseOptions = ref<Course[]>([])
const semesterOptions = ref<Semester[]>([])
const courseClassOptions = ref<CourseClass[]>([])
const studentOptions = ref<Student[]>([])
const relationList = ref<CourseClassStudent[]>([])

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

const studentMap = computed(() => {
  return new Map<string, Student>(
    studentOptions.value.map((student) => [student.id, student] as const),
  )
})

const courseClassMap = computed(() => {
  return new Map<string, CourseClass>(
    courseClassOptions.value.map((courseClass) => [courseClass.id, courseClass] as const),
  )
})

const filteredRelations = computed(() => {
  if (!selectedCourseClassId.value) {
    return []
  }

  return relationList.value.filter(
    (relation) => relation.courseClassId === selectedCourseClassId.value,
  )
})

async function loadPageData() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [
      courseResponse,
      semesterResponse,
      courseClassResponse,
      studentResponse,
      relationResponse,
    ] = await Promise.all([
      courseApi.list(),
      semesterApi.list(),
      courseClassApi.list(),
      studentApi.list(),
      courseClassStudentApi.list(),
    ])

    const courseResult = courseResponse.data
    const semesterResult = semesterResponse.data
    const courseClassResult = courseClassResponse.data
    const studentResult = studentResponse.data
    const relationResult = relationResponse.data

    if (courseResult.code !== 200) {
      throw new Error(courseResult.message)
    }

    if (semesterResult.code !== 200) {
      throw new Error(semesterResult.message)
    }

    if (courseClassResult.code !== 200) {
      throw new Error(courseClassResult.message)
    }

    if (studentResult.code !== 200) {
      throw new Error(studentResult.message)
    }

    if (relationResult.code !== 200) {
      throw new Error(relationResult.message)
    }

    courseOptions.value = courseResult.data
    semesterOptions.value = semesterResult.data
    courseClassOptions.value = courseClassResult.data
    studentOptions.value = studentResult.data
    relationList.value = relationResult.data
  } catch (error) {
    console.error(error)
    errorMessage.value = getApiErrorMessage(error, '教学班名单数据加载失败')
  } finally {
    loading.value = false
  }
}

async function reloadRelations() {
  try {
    const response = await courseClassStudentApi.list()
    const result = response.data

    if (result.code !== 200) {
      throw new Error(result.message)
    }

    relationList.value = result.data
  } catch (error) {
    console.error(error)
    errorMessage.value = getApiErrorMessage(error, '选课关系刷新失败')
  }
}

async function handleAddStudent() {
  enrollmentErrorMessage.value = ''

  if (!selectedCourseClassId.value) {
    enrollmentErrorMessage.value = '请先选择教学班'
    return
  }

  if (!newStudentId.value) {
    enrollmentErrorMessage.value = '请选择学生'
    return
  }

  const alreadyExists = filteredRelations.value.some(
    (relation) => relation.studentId === newStudentId.value,
  )

  if (alreadyExists) {
    enrollmentErrorMessage.value = '该学生已经在此教学班中'
    return
  }

  submitting.value = true

  try {
    const response = await courseClassStudentApi.create({
      courseClassId: selectedCourseClassId.value,
      studentId: newStudentId.value,
    })

    const result = response.data

    if (result.code !== 200) {
      enrollmentErrorMessage.value = result.message
      return
    }

    newStudentId.value = ''
    await reloadRelations()
  } catch (error) {
    console.error(error)
    enrollmentErrorMessage.value = getApiErrorMessage(error, '添加学生失败')
  } finally {
    submitting.value = false
  }
}

async function handleRemoveStudent(relation: CourseClassStudent) {
  const student = studentMap.value.get(relation.studentId)

  const confirmed = window.confirm(
    `确定将学号为“${student?.studentNo ?? relation.studentId}”的学生移出教学班吗？`,
  )

  if (!confirmed) {
    return
  }

  submitting.value = true
  enrollmentErrorMessage.value = ''

  try {
    const response = await courseClassStudentApi.remove(relation.id)

    const result = response.data

    if (result.code !== 200) {
      enrollmentErrorMessage.value = result.message
      return
    }

    await reloadRelations()
  } catch (error) {
    console.error(error)
    enrollmentErrorMessage.value = getApiErrorMessage(error, '移出学生失败')
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

function studentLabel(studentId: string) {
  const student = studentMap.value.get(studentId)

  if (!student) {
    return studentId
  }

  return `${student.studentNo} - ${student.major}`
}

function studentNo(studentId: string) {
  return studentMap.value.get(studentId)?.studentNo ?? studentId
}

function studentClass(studentId: string) {
  return studentMap.value.get(studentId)?.className ?? '-'
}

function studentMajor(studentId: string) {
  return studentMap.value.get(studentId)?.major ?? '-'
}

function studentGradeYear(studentId: string) {
  return studentMap.value.get(studentId)?.gradeYear ?? '-'
}

function formatDate(value: string) {
  if (!value) {
    return '-'
  }

  return value.replace('T', ' ').slice(0, 19)
}

onMounted(() => {
  loadPageData()
})
</script>

<style scoped>
.enrollment-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-header h1 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
}

.error-message {
  margin: 0;
  padding: 12px 14px;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #fef2f2;
  color: #b91c1c;
}

.toolbar-panel,
.enrollment-panel,
.empty-panel {
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

.toolbar-panel label {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #334155;
}

.toolbar-panel select {
  min-width: 420px;
}

.enrollment-panel h2 {
  margin: 0 0 16px;
  color: #1f2937;
  font-size: 18px;
}

.enrollment-form {
  display: flex;
  align-items: center;
  gap: 12px;
}

.enrollment-form select {
  min-width: 320px;
}

select {
  height: 40px;
  padding: 0 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: white;
  color: #1f2937;
  outline: none;
}

select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgb(37 99 235 / 12%);
}

select:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
}

.form-error {
  margin: 12px 0 0;
  color: #dc2626;
}

.primary-button {
  height: 40px;
  padding: 0 14px;
  border: 0;
  border-radius: 6px;
  background: #2563eb;
  color: white;
  cursor: pointer;
}

.primary-button:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.table-panel {
  overflow: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

table {
  width: 100%;
  min-width: 900px;
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

.empty-panel {
  color: #64748b;
  text-align: center;
}

.danger-button {
  height: 34px;
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

.danger-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 760px) {
  .toolbar-panel label,
  .enrollment-form {
    align-items: stretch;
    flex-direction: column;
  }

  .toolbar-panel select,
  .enrollment-form select {
    width: 100%;
    min-width: 0;
  }
}
</style>
