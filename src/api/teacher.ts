import request from '@/api/request'
import type { ApiResult, PageQuery, PageResult } from '@/types/api'

export interface Teacher {
  id: string
  userId: string
  teacherNo: string
  title: string
  createdAt: string
}

export interface TeacherForm {
  userId: string
  teacherNo: string
  title: string
}

export interface TeacherUpdate extends TeacherForm {
  id: string
}

export const teacherApi = {
  page(params: PageQuery) {
    return request.get<ApiResult<PageResult<Teacher>>>('/teachers/page', {
      params,
    })
  },

  list() {
    return request.get<ApiResult<Teacher[]>>('/teachers/list')
  },

  detail(id: string) {
    return request.get<ApiResult<Teacher>>(`/teachers/${id}`)
  },

  create(data: TeacherForm) {
    return request.post<ApiResult<null>>('/teachers', data)
  },

  update(data: TeacherUpdate) {
    return request.put<ApiResult<null>>('/teachers', data)
  },

  remove(id: string) {
    return request.delete<ApiResult<null>>(`/teachers/${id}`)
  },
}
