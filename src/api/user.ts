import request from '@/api/request'
import type { ApiResult, PageQuery, PageResult } from '@/types/api'

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'DISABLED' | 'LOCKED'

export interface User {
  id: string
  username: string
  realName: string
  roleCode: UserRole
  status: UserStatus
  createdAt: string
}

export interface UserCreateForm {
  username: string
  password: string
  realName: string
  roleCode: UserRole
  status: UserStatus
}

export interface UserUpdateForm {
  id: string
  username: string
  password?: string
  realName: string
  roleCode: UserRole
  status: UserStatus
}

export const userApi = {
  page(params: PageQuery) {
    return request.get<ApiResult<PageResult<User>>>('/users/page', {
      params,
    })
  },

  list() {
    return request.get<ApiResult<User[]>>('/users/list')
  },

  detail(id: string) {
    return request.get<ApiResult<User>>(`/users/${id}`)
  },

  create(data: UserCreateForm) {
    return request.post<ApiResult<null>>('/users', data)
  },

  update(data: UserUpdateForm) {
    return request.put<ApiResult<null>>('/users', data)
  },

  remove(id: string) {
    return request.delete<ApiResult<null>>(`/users/${id}`)
  },
}
