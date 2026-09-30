export interface ApiResult<T>{
  code:number
  message:string
  data:T
}

export interface PageQuery{
  current:number
  size:number
}

export interface PageResult<T>{
  current:number
  size:number
  total:number
  pages:number
  records:T[]
}
