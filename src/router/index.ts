import { createRouter, createWebHistory } from 'vue-router'
import login from '@/components/login.vue'
import home from '@/components/home.vue'
import { useAuthStore } from '@/stores/authStore'
import MainLayout from '@/layouts/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          redirect: '/home',
        },
        {
          path: 'home',
          name: 'home',
          component: home,
        },
        {
          path: 'admin/users',
          name: 'admin-users',
          component: () => import('@/views/admin/UserListView.vue'),
          meta: {
            roles: ['ADMIN'],
          },
        },
        {
          path: 'admin/courses',
          name: 'admin-courses',
          component: () => import('@/views/admin/CourseListView.vue'), //调用时才会加载组件
          meta: {
            roles: ['ADMIN'],
          },
        },
        {
          path: 'admin/semesters',
          name: 'admin-semesters',
          component: () => import('@/views/admin/SemesterListView.vue'),
          meta: {
            roles: ['ADMIN'],
          },
        },
        {
          path: 'admin/students',
          name: 'admin-students',
          component: () => import('@/views/admin/StudentListView.vue'),
          meta: {
            roles: ['ADMIN'],
          },
        },
        {
          path: 'admin/teachers',
          name: 'admin-teachers',
          component: () => import('@/views/admin/TeacherListView.vue'),
          meta: {
            roles: ['ADMIN'],
          },
        },
        {
          path: 'admin/course-classes',
          name: 'admin-course-classes',
          component: () => import('@/views/admin/CourseClassListView.vue'),
          meta: {
            roles: ['ADMIN'],
          },
        },
        {
          path: 'admin/course-class-students',
          name: 'admin-course-class-students',
          component: () => import('@/views/admin/CourseClassStudentListView.vue'),
          meta: {
            roles: ['ADMIN'],
          },
        },
        {
          path: 'admin/grade-sheets',
          name: 'admin-grade-sheets',
          component: () => import('@/views/admin/GradeSheetReviewView.vue'),
          meta: {
            roles: ['ADMIN'],
          },
        },
        {
          path: 'teacher/course-classes',
          name: 'teacher-course-classes',
          component: () => import('@/views/teacher/MyCourseClassView.vue'),
          meta: {
            roles: ['TEACHER'],
          },
        },
        {
          path: 'teacher/grade-sheets/:courseClassId/edit',
          name: 'teacher-grade-entry',
          component: () => import('@/views/teacher/GradeEntryView.vue'),
          meta: {
            roles: ['TEACHER'],
          },
        },
        {
          path: 'student/grades',
          name: 'student-grades',
          component: () => import('@/views/student/MyGradeView.vue'),
          meta: {
            roles: ['STUDENT'],
          },
        },
      ],
    },

    {
      path: '/login',
      name: 'login',
      component: login,
    },

    {
      path: '/:pathMatch(.*)*',
      redirect: '/home',
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (to.name === 'login') {
    return true
  }
  if (!authStore.token) {
    return {
      name: 'login',
    }
  }
  if (!authStore.user) {
    try {
      await authStore.fetchProfile()
    } catch (error) {
      console.log(error)
      authStore.clearAuth()
      return {
        name: 'login',
      }
    }
  }

  const allowedRoles = to.meta.roles as string[] | undefined

  if (allowedRoles && !allowedRoles.includes(authStore.roleCode ?? '')) {
    //如果有身份限制且用户职务不匹配
    return { name: 'home' }
  }

  return true
})

export default router
