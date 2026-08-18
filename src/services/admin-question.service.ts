import api from '../api/axios'
import type {
  EmptyQuestionResponse,
  GetAdminQuestionDetailResponse,
  GetAdminQuestionsResponse,
  GetLessonQuestionsResponse,
  LessonQuestionResponse,
  QuestionListItemResponse,
  QuestionListQuery,
  QuestionResponse,
  QuestionStatus,
} from '../types/question.types'

export type QuestionUploadProgressHandler = (percent: number) => void

function getUploadConfig(onProgress?: QuestionUploadProgressHandler) {
  if (!onProgress) return undefined

  return {
    onUploadProgress: (event: { loaded: number; total?: number }) => {
      if (!event.total) return
      onProgress(Math.round((event.loaded * 100) / event.total))
    },
  }
}

export const adminQuestionService = {
  async getQuestions(
    query?: QuestionListQuery,
  ): Promise<{ questions: QuestionListItemResponse[]; total: number }> {
    const response = await api.get<GetAdminQuestionsResponse>(
      '/admin/questions',
      { params: query },
    )
    return {
      questions: response.data.data.questions,
      total: response.data.data.pagination.total,
    }
  },

  async getQuestionsByTopic(
    topicId: string,
    query?: QuestionListQuery,
  ): Promise<{ questions: QuestionListItemResponse[]; total: number }> {
    const response = await api.get<GetAdminQuestionsResponse>(
      `/admin/topics/${topicId}/questions`,
      { params: query },
    )
    return {
      questions: response.data.data.questions,
      total: response.data.data.pagination.total,
    }
  },

  async getQuestionById(questionId: string): Promise<QuestionResponse> {
    const response = await api.get<GetAdminQuestionDetailResponse>(
      `/admin/questions/${questionId}`,
    )
    return response.data.data.question
  },

  async createQuestion(
    formData: FormData,
    onProgress?: QuestionUploadProgressHandler,
  ): Promise<QuestionResponse> {
    const response = await api.post<GetAdminQuestionDetailResponse>(
      '/admin/questions',
      formData,
      getUploadConfig(onProgress),
    )
    onProgress?.(100)
    return response.data.data.question
  },

  async updateQuestion(
    questionId: string,
    formData: FormData,
    onProgress?: QuestionUploadProgressHandler,
  ): Promise<QuestionResponse> {
    const response = await api.patch<GetAdminQuestionDetailResponse>(
      `/admin/questions/${questionId}`,
      formData,
      getUploadConfig(onProgress),
    )
    onProgress?.(100)
    return response.data.data.question
  },

  async updateQuestionStatus(
    questionId: string,
    status: QuestionStatus,
  ): Promise<QuestionResponse> {
    const response = await api.patch<GetAdminQuestionDetailResponse>(
      `/admin/questions/${questionId}/status`,
      { status },
    )
    return response.data.data.question
  },

  async deleteQuestion(questionId: string): Promise<void> {
    await api.delete<EmptyQuestionResponse>(`/admin/questions/${questionId}`)
  },

  async getLessonQuestions(
    lessonId: string,
  ): Promise<LessonQuestionResponse[]> {
    const response = await api.get<GetLessonQuestionsResponse>(
      `/admin/lessons/${lessonId}/questions`,
      { params: { _t: Date.now() } },
    )
    return response.data.data.questions
  },


  async assignQuestionsToLesson(
    lessonId: string,
    questionIds: string[],
  ): Promise<LessonQuestionResponse[]> {
    const response = await api.post<GetLessonQuestionsResponse>(
      `/admin/lessons/${lessonId}/questions`,
      { questionIds },
    )
    return response.data.data.questions
  },

  async removeQuestionFromLesson(
    lessonId: string,
    questionId: string,
  ): Promise<void> {
    await api.delete<EmptyQuestionResponse>(
      `/admin/lessons/${lessonId}/questions/${questionId}`,
    )
  },

  async reorderLessonQuestions(
    lessonId: string,
    questionIds: string[],
  ): Promise<void> {
    await api.patch<EmptyQuestionResponse>(
      `/admin/lessons/${lessonId}/questions/reorder`,
      { questionIds },
    )
  },
}
