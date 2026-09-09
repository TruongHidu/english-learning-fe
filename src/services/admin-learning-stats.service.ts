import api from '../api/axios'
import type { AdminLearningStatsResponse } from '../types/admin-learning-stats.types'

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface AdminLearningStatsQuery {
  wrongQuestionLimit?: number
  topicLimit?: number
  learnerLimit?: number
}

export const adminLearningStatsService = {
  async getAnalytics(params?: AdminLearningStatsQuery): Promise<AdminLearningStatsResponse> {
    const res = await api.get<ApiResponse<AdminLearningStatsResponse>>(
      '/admin/learning-stats/analytics',
      { params },
    )
    return res.data.data
  },
}
