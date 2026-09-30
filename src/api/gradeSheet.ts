import request from '@/api/request'
import type { ApiResult } from '@/types/api'

export type GradeSheetStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'RETURNED'
  | 'REVIEWED'
  | 'PUBLISHED'

export interface ScoreRow {
  studentId: string
  studentNo: string
  realName: string
  usualScore: number | null
  examScore: number | null
  finalScore: number | null
}

export interface GradeSheetDetail {
  id: string
  courseClassId: string
  status: GradeSheetStatus
  usualWeight: number
  examWeight: number
  rows: ScoreRow[]
}

export interface ScoreItemRequest {
  studentId: string
  usualScore: number | null
  examScore: number | null
}

export interface ScoreSaveRequest {
  scores: ScoreItemRequest[]
}

export interface ReviewRequest {
  comment: string
}

export interface GradeOperationLog {
  id: string
  gradeSheetId: string
  operatorId: string
  action: string
  beforeStatus: GradeSheetStatus | null
  afterStatus: GradeSheetStatus | null
  remark: string | null
  createdAt: string
}

export const gradeSheetApi = {
  detailByCourseClass(courseClassId: string) {
    return request.get<ApiResult<GradeSheetDetail>>(
      `/grade-sheets/course-class/${courseClassId}`,
    )
  },

  saveScores(id: string, data: ScoreSaveRequest) {
    return request.put<ApiResult<GradeSheetDetail>>(
      `/grade-sheets/${id}/scores`,
      data,
    )
  },

  submit(id: string) {
    return request.post<ApiResult<null>>(
      `/grade-sheets/${id}/submit`,
    )
  },

  returnSheet(id: string, data: ReviewRequest) {
    return request.post<ApiResult<null>>(
      `/grade-sheets/${id}/return`,
      data,
    )
  },

  review(id: string) {
    return request.post<ApiResult<null>>(
      `/grade-sheets/${id}/review`,
    )
  },

  publish(id: string) {
    return request.post<ApiResult<null>>(
      `/grade-sheets/${id}/publish`,
    )
  },

  logs(id: string) {
    return request.get<ApiResult<GradeOperationLog[]>>(
      `/grade-sheets/${id}/logs`,
    )
  },
}
