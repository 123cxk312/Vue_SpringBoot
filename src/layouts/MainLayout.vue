<template>
  <div class="main-layout">
    <header class="top-bar">
      <div class="system-title">学生成绩管理系统</div>

      <div class="user-area">
        <span>{{ authStore.user?.realName }}</span>
        <span class="role-name">{{ roleName }}</span>

        <button type="button" @click="handleLogout">退出登录</button>
      </div>
    </header>

    <div class="layout-body">
      <aside class="sidebar">
        <nav class="menu">
          <template v-if="authStore.roleCode === 'ADMIN'">
            <RouterLink to="/admin/users">用户管理</RouterLink>
            <RouterLink to="/admin/students">学生管理</RouterLink>
            <RouterLink to="/admin/teachers">教师管理</RouterLink>
            <RouterLink to="/admin/courses">课程管理</RouterLink>
            <RouterLink to="/admin/semesters">学期管理</RouterLink>
            <RouterLink to="/admin/course-classes">教学班管理</RouterLink>
            <RouterLink to="/admin/course-class-students">选课名单</RouterLink>
            <RouterLink to="/admin/grade-sheets">成绩审核</RouterLink>
          </template>

          <template v-else-if="authStore.roleCode === 'TEACHER'">
            <RouterLink to="/teacher/course-classes">我的教学班</RouterLink>
          </template>

          <template v-else-if="authStore.roleCode === 'STUDENT'">
            <RouterLink to="/student/grades">我的成绩</RouterLink>
          </template>
        </nav>
      </aside>

      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter, RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
defineOptions({ name: 'MainLayout' })

const router = useRouter()
const authStore = useAuthStore()

const roleName = computed(() => {
  if (authStore.roleCode === 'ADMIN') {
    return '管理员'
  }
  if (authStore.roleCode === 'TEACHER') {
    return '老师'
  }
  if (authStore.roleCode === 'STUDENT') {
    return '学生'
  }
  return '未知角色'
})

async function handleLogout() {
  await authStore.logout()
  await router.replace('/login')
}
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  background-color: #f5f6f8;
}

.top-bar {
  height: 60px;
  padding: 0 24px;
  box-sizing: border-box;

  display: flex;
  align-items: center;
  justify-content: space-between;

  background-color: white;
  border-bottom: 1px solid #e5e7eb;
}

.system-title {
  font-size: 20px;
  font-weight: bold;
  color: #1f2937;
}

.user-area {
  display: flex;
  align-items: center;
  gap: 14px;
  color: #4b5563;
}

.role-name {
  padding: 3px 8px;
  border-radius: 4px;
  background-color: #eff6ff;
  color: #2563eb;
  font-size: 13px;
}

.user-area button {
  height: 34px;
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background-color: white;
  color: #374151;
  cursor: pointer;
}

.layout-body {
  min-height: calc(100vh - 60px);
  display: flex;
}

.sidebar {
  width: 220px;
  flex-shrink: 0;
  padding: 18px 12px;
  box-sizing: border-box;
  background-color: white;
  border-right: 1px solid #e5e7eb;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.menu a {
  padding: 10px 14px;
  border-radius: 6px;
  color: #4b5563;
  text-decoration: none;
}

.menu a:hover {
  background-color: #f3f4f6;
}

.menu a.router-link-active {
  background-color: #eff6ff;
  color: #2563eb;
}

.content {
  flex: 1;
  min-width: 0;
  padding: 24px;
  box-sizing: border-box;
}
</style>
