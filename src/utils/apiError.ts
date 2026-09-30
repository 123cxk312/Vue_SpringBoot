import axios from 'axios'
import type { ApiResult } from '@/types/api'

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError<ApiResult<unknown>>(error)) {
    if (error.response) {
      return error.response.data?.message ?? fallbackMessage
    }

    if (error.request) {
      return '无法连接后端服务，请确认 Spring Boot 已启动'
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallbackMessage
}
