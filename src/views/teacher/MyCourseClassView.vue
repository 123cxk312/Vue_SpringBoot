<template>
  <main class="my-course-class-page">
    <header class="page-header">
      <h1>我的教学班</h1>
      <span class="total">共 {{ courseClassList.length }} 条</span>
    </header>

    <p v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </p>

    <section class="table-panel">
      <table>
        <thead>
          <tr>
            <th>课程</th>
            <th>学期</th>
            <th>教学班</th>
            <th>平时权重</th>
            <th>考试权重</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="8" class="empty-cell">正在加载...</td>
          </tr>

          <template v-else>
            <tr v-if="courseClassList.length === 0">
              <td colspan="8" class="empty-cell">当前没有负责的教学班</td>
            </tr>

            <tr v-for="courseClass in courseClassList" :key="courseClass.id">
              <td>
                {{ courseClass.courseCode }}
                -
                {{ courseClass.courseName }}
              </td>
              <td>{{ courseClass.semesterName }}</td>
              <td>{{ courseClass.className }}</td>
              <td>{{ formatWeight(courseClass.usualWeight) }}</td>
              <td>{{ formatWeight(courseClass.examWeight) }}</td>
              <td>
                <span class="status-tag" :class="courseClass.status.toLowerCase()">
                  {{ statusText(courseClass.status) }}
                </span>
              </td>
              <td>{{ formatDate(courseClass.createdAt) }}</td>
              <td>
                <button type="button" class="action-button" @click="openGradeEntry(courseClass)">
                  录入成绩
                </button>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { teacherCourseClassApi, type TeacherCourseClassItem } from '@/api/teacherCourseClass'
import type { CourseClassStatus } from '@/api/courseClass'
import { getApiErrorMessage } from '@/utils/apiError'

defineOptions({ name: 'MyCourseClassView' })

const router = useRouter()

const loading = ref(false)
const errorMessage = ref('')
const courseClassList = ref<TeacherCourseClassItem[]>([])

async function loadMyCourseClasses() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await teacherCourseClassApi.list()
    const result = response.data

    if (result.code !== 200) {
      errorMessage.value = result.message
      return
    }

    courseClassList.value = result.data
  } catch (error) {
    console.error(error)
    errorMessage.value = getApiErrorMessage(error, '教学班列表加载失败，请检查教师接口是否已经完成')
  } finally {
    loading.value = false
  }
}

async function openGradeEntry(courseClass: TeacherCourseClassItem) {
  await router.push({
    name: 'teacher-grade-entry',
    params: {
      courseClassId: courseClass.id,
    },
  })
}

function statusText(status: CourseClassStatus) {
  return status === 'ACTIVE' ? '启用' : '停用'
}

function formatWeight(weight: number) {
  return `${(weight * 100).toFixed(0)}%`
}

function formatDate(value: string) {
  if (!value) {
    return '-'
  }

  return value.replace('T', ' ').slice(0, 19)
}

onMounted(() => {
  loadMyCourseClasses()
})
</script>

<style scoped>
.my-course-class-page {
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

.table-panel {
  overflow: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

table {
  width: 100%;
  min-width: 1080px;
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

.action-button {
  height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: 6px;
  background: #2563eb;
  color: white;
  cursor: pointer;
}

.action-button:hover {
  background: #1d4ed8;
}
</style>
