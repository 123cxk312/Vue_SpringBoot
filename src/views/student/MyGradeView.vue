<template>
  <main class="my-grade-page">
    <header class="page-header">
      <h1>我的成绩</h1>
      <span class="total">共 {{ gradeList.length }} 条</span>
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
            <th>学分</th>
            <th>平时成绩</th>
            <th>考试成绩</th>
            <th>最终成绩</th>
            <th>发布时间</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="8" class="empty-cell">正在加载...</td>
          </tr>

          <template v-else>
            <tr v-if="gradeList.length === 0">
              <td colspan="8" class="empty-cell">暂无已经发布的成绩</td>
            </tr>

            <tr v-for="grade in gradeList" :key="`${grade.courseCode}-${grade.courseClassName}`">
              <td>
                {{ grade.courseCode }}
                -
                {{ grade.courseName }}
              </td>
              <td>{{ grade.semesterName }}</td>
              <td>{{ grade.courseClassName }}</td>
              <td>{{ grade.credit }}</td>
              <td>{{ formatScore(grade.usualScore) }}</td>
              <td>{{ formatScore(grade.examScore) }}</td>
              <td>
                <span class="final-score" :class="finalScoreClass(grade.finalScore)">
                  {{ formatScore(grade.finalScore) }}
                </span>
              </td>
              <td>{{ formatDate(grade.publishedAt) }}</td>
            </tr>
          </template>
        </tbody>
      </table>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { studentGradeApi, type StudentGradeItem } from '@/api/studentGrade'
import { getApiErrorMessage } from '@/utils/apiError'

defineOptions({ name: 'MyGradeView' })

const loading = ref(false)
const errorMessage = ref('')
const gradeList = ref<StudentGradeItem[]>([])

async function loadMyGrades() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await studentGradeApi.list()
    const result = response.data

    if (result.code !== 200) {
      errorMessage.value = result.message
      return
    }

    gradeList.value = result.data
  } catch (error) {
    console.error(error)
    errorMessage.value = getApiErrorMessage(error, '成绩加载失败，请检查学生成绩接口是否已经完成')
  } finally {
    loading.value = false
  }
}

function formatScore(score: number | null) {
  if (score === null || score === undefined) {
    return '-'
  }

  return score.toFixed(2)
}

function finalScoreClass(score: number | null) {
  if (score === null || score === undefined) {
    return ''
  }

  return score >= 60 ? 'passed' : 'failed'
}

function formatDate(value: string) {
  if (!value) {
    return '-'
  }

  return value.replace('T', ' ').slice(0, 19)
}

onMounted(() => {
  loadMyGrades()
})
</script>

<style scoped>
.my-grade-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.final-score {
  display: inline-block;
  min-width: 54px;
  padding: 4px 8px;
  border-radius: 5px;
  text-align: center;
  font-weight: 700;
}

.final-score.passed {
  background: #ecfdf5;
  color: #15803d;
}

.final-score.failed {
  background: #fef2f2;
  color: #dc2626;
}
</style>
