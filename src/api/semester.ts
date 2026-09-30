import request from '@/api/request'
import type { ApiResult, PageQuery, PageResult } from '@/types/api'

export type SemesterStatus='PLANNED'|'ACTIVE'|'FINISHED'

export interface Semester{
  id:string
  semesterName:string
  startDate:string
  endDate:string
  status:SemesterStatus
  createdAt:string
}

export interface SemesterForm{
  semesterName: string
  startDate: string
  endDate: string
  status: SemesterStatus
}

export interface SemesterUpdate extends SemesterForm{
  id:string
}

export const semesterApi = {
  page(params: PageQuery) {
    return request.get<ApiResult<PageResult<Semester>>>('/semesters/page', {
      params,
    })
  },

  list() {
    return request.get<ApiResult<Semester[]>>('/semesters/list')
  },

  detail(id: string) {
    return request.get<ApiResult<Semester>>(`/semesters/${id}`)
  },

  create(data: SemesterForm) {
    return request.post<ApiResult<null>>('/semesters', data)
  },

  update(data: SemesterUpdate) {
    return request.put<ApiResult<null>>('/semesters', data)
  },

  remove(id: string) {
    return request.delete<ApiResult<null>>(`/semesters/${id}`)
  },
}
