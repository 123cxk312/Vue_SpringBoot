<template>
  <main class="teacher-page">
    <header class="page-header">
      <h1>教师管理</h1>

      <div class="header-actions">
        <span class="total">共 {{ total }} 条</span>

        <button type="button" class="primary-button" @click="openCreate">新增教师</button>
      </div>
    </header>

    <p v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </p>

    <section v-if="formVisible" class="form-panel">
      <h2>{{ editingId ? '编辑教师' : '新增教师' }}</h2>

      <form class="teacher-form" @submit.prevent="handleSubmit">
        <label>
          <span>关联教师账号</span>
          <select v-model="form.userId" :disabled="saving || userOptionsLoading">
            <option value="">请选择教师账号</option>
            <option v-for="user in teacherUserOptions" :key="user.id" :value="user.id">
              {{ user.username }} - {{ user.realName }}
            </option>
          </select>
          <small v-if="!userOptionsLoading && teacherUserOptions.length === 0" class="option-hint">
            请先在用户管理中创建教师账号
          </small>
        </label>

        <label>
          <span>教师工号</span>
          <input
            v-model.trim="form.teacherNo"
            type="text"
            placeholder="例如 T2026001"
            :disabled="saving"
          />
        </label>

        <label>
          <span>职称</span>
          <input v-model.trim="form.title" type="text" placeholder="例如 讲师" :disabled="saving" />
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
            <th>教师工号</th>
            <th>职称</th>
            <th>登录账号</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="empty-cell">正在加载...</td>
          </tr>

          <template v-else>
            <tr v-if="teacherList.length === 0">
              <td colspan="5" class="empty-cell">暂无教师数据</td>
            </tr>

            <tr v-for="teacher in teacherList" :key="teacher.id">
              <td>{{ teacher.teacherNo }}</td>
              <td>{{ teacher.title }}</td>
              <td>{{ userLabel(teacher.userId) }}</td>
              <td>{{ formatDate(teacher.createdAt) }}</td>
              <td>
                <div class="action-buttons">
                  <button type="button" class="edit-button" @click="openEdit(teacher)">编辑</button>

                  <button type="button" class="danger-button" @click="handleRemove(teacher)">
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
import { teacherApi, type Teacher, type TeacherForm } from '@/api/teacher'
import { userApi, type User } from '@/api/user'
import { getApiErrorMessage } from '@/utils/apiError'

defineOptions({ name: 'TeacherListView' })

const loading = ref(false)
const errorMessage = ref('')
const teacherList = ref<Teacher[]>([])
const total = ref(0)
const current = ref(1)
const size = ref(10)

const formVisible = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const formErrorMessage = ref('')
const userOptions = ref<User[]>([])
const userOptionsLoading = ref(false)

const form = ref<TeacherForm>(createEmptyForm())
const teacherUserOptions = computed(() => {
  return userOptions.value.filter((user) => user.roleCode === 'TEACHER')
})

function createEmptyForm(): TeacherForm {
  return {
    userId: '',
    teacherNo: '',
    title: '',
  }
}

async function loadTeachers() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await teacherApi.page({
      current: current.value,
      size: size.value,
    })

    const result = response.data

    if (result.code !== 200) {
      errorMessage.value = result.message
      return
    }

    const pageData = result.data

    teacherList.value = pageData.records
    total.value = pageData.total
  } catch (error) {
    console.error(error)
    errorMessage.value = getApiErrorMessage(error, '教师列表加载失败，请检查后端服务')
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
    errorMessage.value = getApiErrorMessage(error, '教师账号选项加载失败')
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

function openEdit(teacher: Teacher) {
  editingId.value = teacher.id
  form.value = {
    userId: teacher.userId,
    teacherNo: teacher.teacherNo,
    title: teacher.title,
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
    formErrorMessage.value = '请选择关联教师账号'
    return
  }

  if (!form.value.teacherNo) {
    formErrorMessage.value = '请输入教师工号'
    return
  }

  if (!form.value.title) {
    formErrorMessage.value = '请输入职称'
    return
  }

  saving.value = true

  try {
    const response = editingId.value
      ? await teacherApi.update({
          id: editingId.value,
          ...form.value,
        })
      : await teacherApi.create(form.value)

    const result = response.data

    if (result.code !== 200) {
      formErrorMessage.value = result.message
      return
    }

    closeForm()
    await loadTeachers()
  } catch (error) {
    console.error(error)
    formErrorMessage.value = getApiErrorMessage(
      error,
      editingId.value ? '修改教师失败' : '新增教师失败',
    )
  } finally {
    saving.value = false
  }
}

async function handleRemove(teacher: Teacher) {
  const confirmed = window.confirm(`确定删除工号为“${teacher.teacherNo}”的教师吗？`)

  if (!confirmed) {
    return
  }

  try {
    const response = await teacherApi.remove(teacher.id)
    const result = response.data

    if (result.code !== 200) {
      errorMessage.value = result.message
      return
    }

    if (teacherList.value.length === 1 && current.value > 1) {
      current.value -= 1
    }

    await loadTeachers()
  } catch (error) {
    console.error(error)
    errorMessage.value = getApiErrorMessage(error, '删除教师失败')
  }
}

async function handlePrevious() {
  if (current.value <= 1) {
    return
  }

  current.value -= 1
  await loadTeachers()
}

async function handleNext() {
  if (current.value * size.value >= total.value) {
    return
  }

  current.value += 1
  await loadTeachers()
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
  await Promise.all([loadTeachers(), loadUserOptions()])
})
</script>

<style scoped>
.teacher-page {
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

.teacher-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.teacher-form label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: #334155;
}

.teacher-form input,
.teacher-form select {
  width: 100%;
  height: 40px;
  padding: 0 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: white;
  color: #1f2937;
  outline: none;
}

.teacher-form input:focus,
.teacher-form select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgb(37 99 235 / 12%);
}

.teacher-form input:disabled,
.teacher-form select:disabled {
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

  .teacher-form {
    grid-template-columns: 1fr;
  }
}
</style>
