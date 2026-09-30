<template>
  <main class="course-page">
    <header class="page-header">
      <h1>课程管理</h1>

      <div class="header-actions">
        <span class="total">共 {{ total }} 条</span>

        <button type="button" class="primary-button" @click="openCreate">新增课程</button>
      </div>
    </header>

    <p v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </p>

    <section v-if="formVisible" class="form-panel">
      <h2>{{ editingId ? '编辑课程' : '新增课程' }}</h2>

      <form class="course-form" @submit.prevent="handleSubmit">
        <label>
          <span>课程编码</span>
          <input v-model.trim="form.courseCode" type="text" placeholder="例如 CS101" />
        </label>

        <label>
          <span>课程名称</span>
          <input v-model.trim="form.courseName" type="text" placeholder="例如 Java 程序设计" />
        </label>

        <label>
          <span>学分</span>
          <input v-model.number="form.credit" type="number" min="0.5" step="0.5" />
        </label>

        <label>
          <span>状态</span>
          <select v-model="form.status">
            <option value="ACTIVE">启用</option>
            <option value="INACTIVE">停用</option>
          </select>
        </label>

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
            <th>课程编码</th>
            <th>课程名称</th>
            <th>学分</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="empty-cell">正在加载...</td>
          </tr>

          <tr v-else-if="courseList.length === 0">
            <td colspan="6" class="empty-cell">暂无课程数据</td>
          </tr>

          <tr v-for="course in courseList" :key="course.id">
            <td>{{ course.courseCode }}</td>
            <td>{{ course.courseName }}</td>
            <td>{{ course.credit }}</td>
            <td>
              <span class="status-tag" :class="course.status === 'ACTIVE' ? 'active' : 'inactive'">
                {{ statusText(course.status) }}
              </span>
            </td>
            <td>{{ formatDate(course.createdAt) }}</td>
            <td>
              <div class="action-buttons">
                <button type="button" class="edit-button" @click="openEdit(course)">编辑</button>

                <button type="button" class="danger-button" @click="handleRemove(course)">
                  删除
                </button>
              </div>
            </td>
          </tr>
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
import { onMounted, ref } from 'vue'
import { courseApi, type Course, type CourseStatus, type CourseForm } from '@/api/course'
import { getApiErrorMessage } from '@/utils/apiError'

defineOptions({ name: 'CourseListView' })

const loading = ref(false)
const errorMessage = ref('')
const courseList = ref<Course[]>([])
const total = ref(0)
const current = ref(1)
const size = ref(10)

const formVisible = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const formErrorMessage = ref('')

const form = ref<CourseForm>(createEmptyForm())

async function loadCourses() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await courseApi.page({
      current: current.value,
      size: size.value,
    })

    const result = response.data

    if (result.code !== 200) {
      errorMessage.value = result.message
      return
    }

    const pageData = result.data

    courseList.value = pageData.records
    total.value = pageData.total
  } catch (error) {
    console.error(error)
    errorMessage.value = getApiErrorMessage(error, '课程列表加载失败，请检查后端服务')
  } finally {
    loading.value = false
  }
}

async function handleRemove(course: Course) {
  const confirmed = window.confirm(`确定删除${course.courseName}吗`)

  if (!confirmed) {
    return
  }
  try {
    const response = await courseApi.remove(course.id)
    const result = response.data

    if (result.code !== 200) {
      errorMessage.value = result.message
      return
    }
    if (courseList.value.length === 1 && current.value > 1) {
      current.value -= 1
    }

    await loadCourses()
  } catch (error) {
    console.error(error)
    errorMessage.value = getApiErrorMessage(error, '删除课程失败')
  }
}

async function handlePrevious() {
  if (current.value <= 1) {
    return
  }
  current.value -= 1
  await loadCourses()
}

async function handleNext() {
  if (current.value * size.value >= total.value) {
    return
  }
  current.value += 1
  await loadCourses()
}

function statusText(status: CourseStatus) {
  return status === 'ACTIVE' ? '启用' : '停用'
}

function formatDate(value: string) {
  if (!value) {
    return '-'
  }
  return value.replace('T', ' ').slice(0, 19)
}

function createEmptyForm(): CourseForm {
  return {
    courseCode: '',
    courseName: '',
    credit: 1,
    status: 'ACTIVE',
  }
}

function openCreate() {
  editingId.value = null
  form.value = createEmptyForm()
  formErrorMessage.value = ''
  formVisible.value = true
}

function openEdit(course: Course) {
  editingId.value = course.id
  form.value = {
    courseCode: course.courseCode,
    courseName: course.courseName,
    credit: course.credit,
    status: course.status,
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

  if (!form.value.courseCode) {
    formErrorMessage.value = '请输入课程编码'
    return
  }

  if (!form.value.courseName) {
    formErrorMessage.value = '请输入课程名称'
    return
  }

  if (!form.value.credit || form.value.credit <= 0) {
    formErrorMessage.value = '学分必须大于 0'
    return
  }

  saving.value = true

  try {
    const response = editingId.value
      ? await courseApi.update({
          id: editingId.value,
          ...form.value,
        })
      : await courseApi.create(form.value)

    const result = response.data

    if (result.code !== 200) {
      formErrorMessage.value = result.message
      return
    }

    closeForm()
    await loadCourses()
  } catch (error) {
    console.error(error)
    formErrorMessage.value = getApiErrorMessage(
      error,
      editingId.value ? '修改课程失败' : '新增课程失败',
    )
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadCourses()
})
</script>

<style scoped>
.course-page {
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

.course-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.course-form label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: #334155;
}

.course-form input,
.course-form select {
  width: 100%;
  height: 40px;
  padding: 0 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: white;
  color: #1f2937;
  outline: none;
}

.course-form input:focus,
.course-form select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgb(37 99 235 / 12%);
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
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

table {
  width: 100%;
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

@media (max-width: 760px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .course-form {
    grid-template-columns: 1fr;
  }
}
</style>
