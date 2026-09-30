import request from "@/api/request"
import { type ApiResult } from "@/types/api"

export interface LoginRequest{
  username:string,
  password:string
}

export interface UserProfile{
  id:string,
  username:string,
  realName:string,
  roleCode:'STUDENT'|'TEACHER'|'ADMIN',
  status:'ACTIVE'|'DISABLED'|'LOCKED',
  studentId:string|null,
  teacherId:string|null
}

export interface LoginResponse{
  token:string,
  user:UserProfile
}


export const authApi={
  login(data:LoginRequest){
    return request.post<ApiResult<LoginResponse>>('/auth/login',data)
  },
  me(){
    return request.get<ApiResult<UserProfile>>('/auth/me')

  },
  logout(){
    return request.post<ApiResult<null>>('/auth/logout')
  },
}
