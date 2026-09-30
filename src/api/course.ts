import request from '@/api/request'
import type { ApiResult, PageQuery, PageResult } from '@/types/api'

export type CourseStatus = 'ACTIVE' | 'INACTIVE'

export interface Course {
  id: string
  courseCode: string
  courseName: string
  credit: number
  status: CourseStatus
  createdAt: string
}

export interface CourseForm {
  courseCode: string
  courseName: string
  credit: number
  status: CourseStatus
}

export interface CourseUpdate extends CourseForm {
  id: string
}

export const courseApi = {
  page(params: PageQuery) {
    return request.get<ApiResult<PageResult<Course>>>('/courses/page', { params })
  },

  list() {
    return request.get<ApiResult<Course[]>>('/courses/list')
  },

  detail(id: string) {
    return request.get<ApiResult<Course>>(`/courses/${id}`)
  },

  create(data: CourseForm) {
    return request.post<ApiResult<null>>('/courses', data)
  },

  update(data: CourseUpdate) {
    return request.put<ApiResult<null>>('/courses', data)
  },

  remove(id: string) {
    return request.delete<ApiResult<null>>(`/courses/${id}`)
  },
}
