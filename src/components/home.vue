<template>
  <main class="dashboard-page">
    <section class="welcome-panel">
      <div>
        <p class="eyebrow">工作台</p>

        <h1>
          欢迎回来，{{ authStore.user?.realName || '用户' }}
        </h1>

        <p class="description">
          {{ roleDescription }}
        </p>
      </div>

      <span class="role-badge">
        {{ roleName }}
      </span>
    </section>

    <section class="dashboard-grid">
      <article
        v-for="item in dashboardItems"
        :key="item.title"
        class="dashboard-card"
      >
        <h2>{{ item.title }}</h2>
        <p>{{ item.description }}</p>
      </article>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'

defineOptions({ name: 'home' })

const authStore = useAuthStore()

interface DashboardItem {
  title: string
  description: string
}

const roleName = computed(() => {
  if (authStore.roleCode === 'ADMIN') {
    return '管理员'
  }

  if (authStore.roleCode === 'TEACHER') {
    return '教师'
  }

  if (authStore.roleCode === 'STUDENT') {
    return '学生'
  }

  return '未知角色'
})

const roleDescription = computed(() => {
  if (authStore.roleCode === 'ADMIN') {
    return '维护账号、基础数据、教学班，并负责成绩审核与发布。'
  }

  if (authStore.roleCode === 'TEACHER') {
    return '查看负责的教学班，完成成绩录入与提交。'
  }

  if (authStore.roleCode === 'STUDENT') {
    return '查看个人课程、已发布成绩和成绩单。'
  }

  return '当前角色暂无可用的工作台功能。'
})

const dashboardItems = computed<DashboardItem[]>(() => {
  if (authStore.roleCode === 'ADMIN') {
    return [
      {
        title: '用户与账号',
        description: '管理学生、教师和管理员账号。',
      },
      {
        title: '基础数据',
        description: '维护课程、学期、学生和教师资料。',
      },
      {
        title: '教学班与选课',
        description: '创建教学班并维护学生名单。',
      },
      {
        title: '成绩审核',
        description: '审核、退回和发布教学班成绩单。',
      },
    ]
  }

  if (authStore.roleCode === 'TEACHER') {
    return [
      {
        title: '我的教学班',
        description: '查看本学期负责的课程和班级。',
      },
      {
        title: '成绩录入',
        description: '录入平时成绩、考试成绩并提交审核。',
      },
    ]
  }

  if (authStore.roleCode === 'STUDENT') {
    return [
      {
        title: '我的课程',
        description: '查看当前学期已加入的教学班。',
      },
      {
        title: '我的成绩',
        description: '查看已经审核发布的课程成绩。',
      },
    ]
  }

  return []
})
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.welcome-panel {
  padding: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

.eyebrow {
  margin: 0 0 8px;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
}

.welcome-panel h1 {
  margin: 0;
  color: #0f172a;
  font-size: 26px;
}

.description {
  margin: 10px 0 0;
  color: #64748b;
  line-height: 1.7;
}

.role-badge {
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: 5px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 14px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.dashboard-card {
  min-height: 132px;
  padding: 22px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

.dashboard-card h2 {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
}

.dashboard-card p {
  margin: 12px 0 0;
  color: #64748b;
  line-height: 1.7;
}

@media (max-width: 760px) {
  .welcome-panel {
    align-items: flex-start;
    flex-direction: column;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
