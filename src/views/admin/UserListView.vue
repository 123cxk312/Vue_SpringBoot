<template>
  <main class="user-page">
    <header class="page-header">
      <h1>用户管理</h1>

      <div class="header-actions">
        <span class="total">共 {{ total }} 条</span>

        <button type="button" class="primary-button" @click="openCreate">新增用户</button>
      </div>
    </header>

    <p v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </p>

    <p v-if="successMessage" class="success-message">
      {{ successMessage }}
    </p>

    <section v-if="formVisible" class="form-panel">
      <h2>{{ editingId ? '编辑用户' : '新增用户' }}</h2>

      <form class="user-form" @submit.prevent="handleSubmit">
        <label>
          <span>用户名</span>
          <input
            v-model.trim="form.username"
            type="text"
            autocomplete="off"
            placeholder="3 到 50 个字符"
            :disabled="saving"
          />
        </label>

        <label>
          <span>真实姓名</span>
          <input
            v-model.trim="form.realName"
            type="text"
            autocomplete="off"
            placeholder="请输入真实姓名"
            :disabled="saving"
          />
        </label>

        <label>
          <span>
            密码
            <small v-if="editingId">留空表示不修改</small>
          </span>
          <input
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            :placeholder="editingId ? '如需修改请输入新密码' : '至少 5 个字符'"
            :disabled="saving"
          />
        </label>

        <label>
          <span>
            角色
            <small v-if="isCurrentUser">当前账号不可修改</small>
          </span>
          <select v-model="form.roleCode" :disabled="saving || isCurrentUser">
            <option value="STUDENT">学生</option>
            <option value="TEACHER">教师</option>
            <option value="ADMIN">管理员</option>
          </select>
        </label>

        <label>
          <span>
            状态
            <small v-if="isCurrentUser">当前账号不可修改</small>
          </span>
          <select v-model="form.status" :disabled="saving || isCurrentUser">
            <option value="ACTIVE">启用</option>
            <option value="DISABLED">停用</option>
            <option value="LOCKED">锁定</option>
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
            <th>用户名</th>
            <th>真实姓名</th>
            <th>角色</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="empty-cell">正在加载...</td>
          </tr>

          <tr v-else-if="userList.length === 0">
            <td colspan="6" class="empty-cell">暂无用户数据</td>
          </tr>

          <tr v-for="user in userList" :key="user.id">
            <td>
              {{ user.username }}
              <span v-if="user.id === authStore.user?.id" class="current-account"> 当前账号 </span>
            </td>
            <td>{{ user.realName }}</td>
            <td>
              <span class="role-tag" :class="user.roleCode.toLowerCase()">
                {{ roleText(user.roleCode) }}
              </span>
            </td>
            <td>
              <span class="status-tag" :class="user.status.toLowerCase()">
                {{ statusText(user.status) }}
              </span>
            </td>
            <td>{{ formatDate(user.createdAt) }}</td>
            <td>
              <div class="action-buttons">
                <button type="button" class="edit-button" @click="openEdit(user)">编辑</button>

                <button
                  type="button"
                  class="danger-button"
                  :disabled="user.id === authStore.user?.id"
                  @click="handleRemove(user)"
                >
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
import { computed, onMounted, ref } from 'vue'
import { userApi, type User, type UserRole, type UserStatus, type UserUpdateForm } from '@/api/user'
import { useAuthStore } from '@/stores/authStore'
import { getApiErrorMessage } from '@/utils/apiError'

defineOptions({ name: 'UserListView' })

interface UserFormState {
  username: string
  password: string
  realName: string
  roleCode: UserRole
  status: UserStatus
}

const authStore = useAuthStore()

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const userList = ref<User[]>([])
const total = ref(0)
const current = ref(1)
const size = ref(10)

const formVisible = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const formErrorMessage = ref('')

const form = ref<UserFormState>(createEmptyForm())

const isCurrentUser = computed(() => {
  return Boolean(editingId.value && authStore.user?.id === editingId.value)
})

function createEmptyForm(): UserFormState {
  return {
    username: '',
    password: '',
    realName: '',
    roleCode: 'STUDENT',
    status: 'ACTIVE',
  }
}

async function loadUsers() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await userApi.page({
      current: current.value,
      size: size.value,
    })

    const result = response.data

    if (result.code !== 200) {
      errorMessage.value = result.message
      return
    }

    userList.value = result.data.records
    total.value = result.data.total
  } catch (error) {
    console.error(error)
    errorMessage.value = getApiErrorMessage(error, '用户列表加载失败，请检查后端服务')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = createEmptyForm()
  formErrorMessage.value = ''
  errorMessage.value = ''
  successMessage.value = ''
  formVisible.value = true
}

function openEdit(user: User) {
  editingId.value = user.id
  form.value = {
    username: user.username,
    password: '',
    realName: user.realName,
    roleCode: user.roleCode,
    status: user.status,
  }
  formErrorMessage.value = ''
  errorMessage.value = ''
  successMessage.value = ''
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
  successMessage.value = ''

  const validationMessage = validateForm()

  if (validationMessage) {
    formErrorMessage.value = validationMessage
    return
  }

  saving.value = true

  try {
    const response = editingId.value
      ? await userApi.update(buildUpdatePayload())
      : await userApi.create({
          username: form.value.username,
          password: form.value.password,
          realName: form.value.realName,
          roleCode: form.value.roleCode,
          status: form.value.status,
        })

    const result = response.data

    if (result.code !== 200) {
      formErrorMessage.value = result.message
      return
    }

    const message = editingId.value ? '用户修改成功' : '用户创建成功'

    closeForm()
    await loadUsers()
    successMessage.value = message
  } catch (error) {
    console.error(error)
    formErrorMessage.value = getApiErrorMessage(
      error,
      editingId.value ? '修改用户失败' : '新增用户失败',
    )
  } finally {
    saving.value = false
  }
}

async function handleRemove(user: User) {
  if (user.id === authStore.user?.id) {
    errorMessage.value = '不能删除当前登录账号'
    return
  }

  const confirmed = window.confirm(`确定删除用户“${user.username}”吗？`)

  if (!confirmed) {
    return
  }

  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await userApi.remove(user.id)
    const result = response.data

    if (result.code !== 200) {
      errorMessage.value = result.message
      return
    }

    if (userList.value.length === 1 && current.value > 1) {
      current.value -= 1
    }

    await loadUsers()
    successMessage.value = '用户删除成功'
  } catch (error) {
    console.error(error)
    errorMessage.value = getApiErrorMessage(error, '删除用户失败')
  }
}

async function handlePrevious() {
  if (current.value <= 1) {
    return
  }

  current.value -= 1
  await loadUsers()
}

async function handleNext() {
  if (current.value * size.value >= total.value) {
    return
  }

  current.value += 1
  await loadUsers()
}

function validateForm() {
  if (form.value.username.length < 3 || form.value.username.length > 50) {
    return '用户名长度必须在 3 到 50 个字符之间'
  }

  if (!form.value.realName) {
    return '请输入真实姓名'
  }

  if (form.value.realName.length > 50) {
    return '真实姓名不能超过 50 个字符'
  }

  if (!editingId.value && !form.value.password) {
    return '请输入密码'
  }

  if (form.value.password && (form.value.password.length < 5 || form.value.password.length > 100)) {
    return '密码长度必须在 5 到 100 个字符之间'
  }

  return null
}

function buildUpdatePayload(): UserUpdateForm {
  const payload: UserUpdateForm = {
    id: editingId.value as string,
    username: form.value.username,
    realName: form.value.realName,
    roleCode: form.value.roleCode,
    status: form.value.status,
  }

  if (form.value.password) {
    payload.password = form.value.password
  }

  return payload
}

function roleText(roleCode: UserRole) {
  const roleMap: Record<UserRole, string> = {
    STUDENT: '学生',
    TEACHER: '教师',
    ADMIN: '管理员',
  }

  return roleMap[roleCode]
}

function statusText(status: UserStatus) {
  const statusMap: Record<UserStatus, string> = {
    ACTIVE: '启用',
    DISABLED: '停用',
    LOCKED: '锁定',
  }

  return statusMap[status]
}

function formatDate(value: string) {
  if (!value) {
    return '-'
  }

  return value.replace('T', ' ').slice(0, 19)
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-page {
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

.user-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.user-form label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: #334155;
}

.user-form label > span {
  min-height: 21px;
}

.user-form small {
  margin-left: 6px;
  color: #94a3b8;
  font-size: 12px;
}

.user-form input,
.user-form select {
  width: 100%;
  height: 40px;
  padding: 0 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: white;
  color: #1f2937;
  outline: none;
}

.user-form input:focus,
.user-form select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgb(37 99 235 / 12%);
}

.user-form input:disabled,
.user-form select:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
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

.primary-button:disabled,
.danger-button:disabled {
  opacity: 0.5;
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
  min-width: 860px;
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

.current-account {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
}

.role-tag,
.status-tag {
  display: inline-block;
  padding: 4px 9px;
  border-radius: 5px;
  font-size: 13px;
}

.role-tag.student {
  background: #eff6ff;
  color: #2563eb;
}

.role-tag.teacher {
  background: #f5f3ff;
  color: #7c3aed;
}

.role-tag.admin {
  background: #fff7ed;
  color: #c2410c;
}

.status-tag.active {
  background: #ecfdf5;
  color: #15803d;
}

.status-tag.disabled {
  background: #f1f5f9;
  color: #64748b;
}

.status-tag.locked {
  background: #fef2f2;
  color: #b91c1c;
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

.danger-button:hover:not(:disabled) {
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

  .user-form {
    grid-template-columns: 1fr;
  }
}
</style>
