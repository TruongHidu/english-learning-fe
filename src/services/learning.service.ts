import api from '../api/axios'
import type {
  StartLessonData,
  StartLessonResponse,
  SubmitAnswerPayload,
  SubmitAnswerResult,
  SubmitAnswerResponse,
} from '../types/learning.types'

export const learningService = {
  async startLesson(lessonId: string): Promise<StartLessonData> {
    const response = await api.post<StartLessonResponse>(`/lessons/${lessonId}/start`)
    return response.data.data
  },

  async submitAnswer(sessionId: string, payload: SubmitAnswerPayload): Promise<SubmitAnswerResult> {
    const response = await api.post<SubmitAnswerResponse>(
      `/sessions/${sessionId}/submit-answer`,
      payload,
    )
    return response.data.data
  },

  getProgress: <TResponse>() => api.get<TResponse>('/learning/progress'),

  updateProgress: <TResponse, TPayload>(payload: TPayload) =>
    api.put<TResponse>('/learning/progress', payload),
}
