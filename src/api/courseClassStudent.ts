import request from '@/api/request'
import type { ApiResult, PageQuery, PageResult } from '@/types/api'

export interface CourseClassStudent {
  id: string
  courseClassId: string
  studentId: string
  createdAt: string
}

export interface CourseClassStudentForm {
  courseClassId: string
  studentId: string
}

export interface CourseClassStudentUpdate extends CourseClassStudentForm {
  id: string
}

export const courseClassStudentApi = {
  page(params: PageQuery) {
    return request.get<ApiResult<PageResult<CourseClassStudent>>>('/course-class-students/page', { params })
  },

  list() {
    return request.get<ApiResult<CourseClassStudent[]>>('/course-class-students/list')
  },

  detail(id: string) {
    return request.get<ApiResult<CourseClassStudent>>(`/course-class-students/${id}`)
  },

  create(data: CourseClassStudentForm) {
    return request.post<ApiResult<null>>('/course-class-students',data)
  },

  update(data: CourseClassStudentUpdate) {
    return request.put<ApiResult<null>>('/course-class-students',data)
  },

  remove(id: string) {
    return request.delete<ApiResult<null>>(`/course-class-students/${id}`)
  },
}
