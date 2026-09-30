import request from '@/api/request'
import type { ApiResult, PageQuery, PageResult } from '@/types/api'

export type CourseClassStatus = 'ACTIVE' | 'INACTIVE'

export interface CourseClass {
  id: string
  courseId: string
  semesterId: string
  teacherId: string
  className: string
  usualWeight: number
  examWeight: number
  status: CourseClassStatus
  createdAt: string
}

export interface CourseClassForm {
  courseId: string
  semesterId: string
  teacherId: string
  className: string
  usualWeight: number
  examWeight: number
  status: CourseClassStatus
}

export interface CourseClassUpdate extends CourseClassForm {
  id: string
}

export const courseClassApi = {
  page(params: PageQuery) {
    return request.get<ApiResult<PageResult<CourseClass>>>(
      '/course-classes/page',
      { params },
    )
  },

  list() {
    return request.get<ApiResult<CourseClass[]>>('/course-classes/list')
  },

  detail(id: string) {
    return request.get<ApiResult<CourseClass>>(`/course-classes/${id}`)
  },

  create(data: CourseClassForm) {
    return request.post<ApiResult<null>>('/course-classes', data)
  },

  update(data: CourseClassUpdate) {
    return request.put<ApiResult<null>>('/course-classes', data)
  },

  remove(id: string) {
    return request.delete<ApiResult<null>>(`/course-classes/${id}`)
  },
}
