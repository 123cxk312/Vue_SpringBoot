<template>
  <main class="student-page">
    <header class="page-header">
      <h1>学生管理</h1>

      <div class="header-actions">
        <span class="total">共 {{ total }} 条</span>

        <button type="button" class="primary-button" @click="openCreate">新增学生</button>
      </div>
    </header>

    <p v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </p>

    <section v-if="formVisible" class="form-panel">
      <h2>{{ editingId ? '编辑学生' : '新增学生' }}</h2>

      <form class="student-form" @submit.prevent="handleSubmit">
        <label>
          <span>关联学生账号</span>
          <select v-model="form.userId" :disabled="saving || userOptionsLoading">
            <option value="">请选择学生账号</option>
            <option v-for="user in studentUserOptions" :key="user.id" :value="user.id">
              {{ user.username }} - {{ user.realName }}
            </option>
          </select>
          <small v-if="!userOptionsLoading && studentUserOptions.length === 0" class="option-hint">
            请先在用户管理中创建学生账号
          </small>
        </label>

        <label>
          <span>学号</span>
          <input
            v-model.trim="form.studentNo"
            type="text"
            placeholder="例如 20260001"
            :disabled="saving"
          />
        </label>

        <label>
          <span>班级</span>
          <input
            v-model.trim="form.className"
            type="text"
            placeholder="例如 软件工程 1 班"
            :disabled="saving"
          />
        </label>

        <label>
          <span>专业</span>
          <input
            v-model.trim="form.major"
            type="text"
            placeholder="例如 软件工程"
            :disabled="saving"
          />
        </label>

        <label>
          <span>入学年级</span>
          <input
            v-model.number="form.gradeYear"
            type="number"
            min="2000"
            max="2100"
            :disabled="saving"
          />
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
            <th>学号</th>
            <th>班级</th>
            <th>专业</th>
            <th>入学年级</th>
            <th>登录账号</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="empty-cell">正在加载...</td>
          </tr>

          <template v-else>
            <tr v-if="studentList.length === 0">
              <td colspan="7" class="empty-cell">暂无学生数据</td>
            </tr>

            <tr v-for="student in studentList" :key="student.id">
              <td>{{ student.studentNo }}</td>
              <td>{{ student.className }}</td>
              <td>{{ student.major }}</td>
              <td>{{ student.gradeYear }}</td>
              <td>{{ userLabel(student.userId) }}</td>
              <td>{{ formatDate(student.createdAt) }}</td>
              <td>
                <div class="action-buttons">
                  <button type="button" class="edit-button" @click="openEdit(student)">编辑</button>

                  <button type="button" class="danger-button" @click="handleRemove(student)">
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
import { studentApi, type Student, type StudentForm } from '@/api/student'
import { userApi, type User } from '@/api/user'
import { getApiErrorMessage } from '@/utils/apiError'

defineOptions({ name: 'StudentListView' })

const loading = ref(false)
const errorMessage = ref('')
const studentList = ref<Student[]>([])
const total = ref(0)
const current = ref(1)
const size = ref(10)

const formVisible = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const formErrorMessage = ref('')
const userOptions = ref<User[]>([])
const userOptionsLoading = ref(false)

const form = ref<StudentForm>(createEmptyForm())
const studentUserOptions = computed(() => {
  return userOptions.value.filter((user) => user.roleCode === 'STUDENT')
})

function createEmptyForm(): StudentForm {
  return {
    userId: '',
    studentNo: '',
    className: '',
    major: '',
    gradeYear: new Date().getFullYear(),
  }
}

async function loadStudents() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await studentApi.page({
      current: current.value,
      size: size.value,
    })

    const result = response.data

    if (result.code !== 200) {
      errorMessage.value = result.message
      return
    }

    const pageData = result.data

    studentList.value = pageData.records
    total.value = pageData.total
  } catch (error) {
    console.error(error)
    errorMessage.value = getApiErrorMessage(error, '学生列表加载失败，请检查后端服务')
  } finally {
    loading.value = false
  }
}

async function loadUserOptions() {
  userOptionsLoading.value = true

  try {
    const response = await userApi.list()
    const result = response.data

    if (result.code !== 200) {
      errorMessage.value = result.message
      return
    }

    userOptions.value = result.data
  } catch (error) {
    console.error(error)
    errorMessage.value = getApiErrorMessage(error, '学生账号选项加载失败')
  } finally {
    userOptionsLoading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = createEmptyForm()
  formErrorMessage.value = ''
  formVisible.value = true
}

function openEdit(student: Student) {
  editingId.value = student.id
  form.value = {
    userId: student.userId,
    studentNo: student.studentNo,
    className: student.className,
    major: student.major,
    gradeYear: student.gradeYear,
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

  if (!form.value.userId) {
    formErrorMessage.value = '请选择关联学生账号'
    return
  }

  if (!form.value.studentNo) {
    formErrorMessage.value = '请输入学号'
    return
  }

  if (!form.value.className) {
    formErrorMessage.value = '请输入班级'
    return
  }

  if (!form.value.major) {
    formErrorMessage.value = '请输入专业'
    return
  }

  if (form.value.gradeYear < 2000 || form.value.gradeYear > 2100) {
    formErrorMessage.value = '请输入有效的入学年级'
    return
  }

  saving.value = true

  try {
    const response = editingId.value
      ? await studentApi.update({
          id: editingId.value,
          ...form.value,
        })
      : await studentApi.create(form.value)

    const result = response.data

    if (result.code !== 200) {
      formErrorMessage.value = result.message
      return
    }

    closeForm()
    await loadStudents()
  } catch (error) {
    console.error(error)
    formErrorMessage.value = getApiErrorMessage(
      error,
      editingId.value ? '修改学生失败' : '新增学生失败',
    )
  } finally {
    saving.value = false
  }
}

async function handleRemove(student: Student) {
  const confirmed = window.confirm(`确定删除学号为“${student.studentNo}”的学生吗？`)

  if (!confirmed) {
    return
  }

  try {
    const response = await studentApi.remove(student.id)
    const result = response.data

    if (result.code !== 200) {
      errorMessage.value = result.message
      return
    }

    if (studentList.value.length === 1 && current.value > 1) {
      current.value -= 1
    }

    await loadStudents()
  } catch (error) {
    console.error(error)
    errorMessage.value = getApiErrorMessage(error, '删除学生失败')
  }
}

async function handlePrevious() {
  if (current.value <= 1) {
    return
  }

  current.value -= 1
  await loadStudents()
}

async function handleNext() {
  if (current.value * size.value >= total.value) {
    return
  }

  current.value += 1
  await loadStudents()
}

function formatDate(value: string) {
  if (!value) {
    return '-'
  }

  return value.replace('T', ' ').slice(0, 19)
}

function userLabel(userId: string) {
  const user = userOptions.value.find((item) => item.id === userId)

  if (!user) {
    return userId
  }

  return `${user.username} - ${user.realName}`
}

onMounted(async () => {
  await Promise.all([loadStudents(), loadUserOptions()])
})
</script>

<style scoped>
.student-page {
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

.student-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.student-form label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: #334155;
}

.student-form input,
.student-form select {
  width: 100%;
  height: 40px;
  padding: 0 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: white;
  color: #1f2937;
  outline: none;
}

.student-form input:focus,
.student-form select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgb(37 99 235 / 12%);
}

.student-form input:disabled,
.student-form select:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
}

.option-hint {
  color: #b45309;
  font-size: 13px;
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

  .student-form {
    grid-template-columns: 1fr;
  }
}
</style>
