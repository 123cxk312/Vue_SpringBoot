import request from '@/api/request'
import type { ApiResult, PageQuery, PageResult } from '@/types/api'

export interface Student{
  id:string
  userId:string
  studentNo: string
  className: string
  major: string
  gradeYear: number
  createdAt: string
}

export interface StudentForm {
  userId: string
  studentNo: string
  className: string
  major: string
  gradeYear: number
}

export interface StudentUpdate extends StudentForm {
  id: string
}

export const studentApi = {
  page(params: PageQuery) {
    return request.get<ApiResult<PageResult<Student>>>('/students/page', {
      params,
    })
  },

  list() {
    return request.get<ApiResult<Student[]>>('/students/list')
  },

  detail(id: string) {
    return request.get<ApiResult<Student>>(`/students/${id}`)
  },

  create(data: StudentForm) {
    return request.post<ApiResult<null>>('/students', data)
  },

  update(data: StudentUpdate) {
    return request.put<ApiResult<null>>('/students', data)
  },

  remove(id: string) {
    return request.delete<ApiResult<null>>(`/students/${id}`)
  },
}
