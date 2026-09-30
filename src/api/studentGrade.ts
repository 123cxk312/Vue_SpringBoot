import request from '@/api/request'
import type { ApiResult } from '@/types/api'

export interface StudentGradeItem {
  courseCode: string
  courseName: string
  semesterName: string
  courseClassName: string
  credit: number
  usualScore: number | null
  examScore: number | null
  finalScore: number | null
  publishedAt: string
}

export const studentGradeApi = {
  list() {
    return request.get<ApiResult<StudentGradeItem[]>>(
      '/student/grades',
    )
  },
}
