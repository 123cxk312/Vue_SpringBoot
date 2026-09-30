import request from '@/api/request'
import type { ApiResult } from '@/types/api'
import type { CourseClassStatus } from '@/api/courseClass'

export interface TeacherCourseClassItem {
  id: string
  courseId: string
  courseCode: string
  courseName: string
  semesterId: string
  semesterName: string
  teacherId: string
  teacherName: string
  className: string
  usualWeight: number
  examWeight: number
  status: CourseClassStatus
  createdAt: string
}

export const teacherCourseClassApi = {
  list() {
    return request.get<ApiResult<TeacherCourseClassItem[]>>(
      '/teacher/course-classes',
    )
  },
}
