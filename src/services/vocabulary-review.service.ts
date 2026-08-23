import api from '../api/axios'
import type {
  ReviewDueQuery,
  ReviewDueResponse,
  ReviewSessionResponse,
  ReviewStatsResponse,
  SubmitReviewResultsRequest,
  SubmitReviewResultsResponse,
} from '../types/vocabulary-review.types'

export const vocabularyReviewService = {
  async getDue(params?: ReviewDueQuery): Promise<ReviewDueResponse> {
    const response = await api.get<ReviewDueResponse>('/user/vocabularies/review/due', { params })
    return response.data
  },

  async getSession(params?: ReviewDueQuery): Promise<ReviewSessionResponse> {
    const response = await api.get<ReviewSessionResponse>('/user/vocabularies/review/session', { params })
    return response.data
  },

  async submitResults(data: SubmitReviewResultsRequest): Promise<SubmitReviewResultsResponse> {
    const response = await api.post<SubmitReviewResultsResponse>('/user/vocabularies/review/submit', data)
    return response.data
  },

  async getStats(): Promise<ReviewStatsResponse> {
    const response = await api.get<ReviewStatsResponse>('/user/vocabularies/review/stats')
    return response.data
  },
}
