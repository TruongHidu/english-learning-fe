import api from '../api/axios'

export interface GenerateVocabulariesPayload {
  topicId: string
  lessonId?: string
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  quantity: number
}

export interface GenerateQuestionsPayload {
  topicId: string
  lessonId?: string
  vocabularyId?: string
  vocabularyIds?: string[]
  questionTypes: string[]
  quantity: number
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
}

export const adminAiService = {
  async generateVocabularies(payload: GenerateVocabulariesPayload, options?: { signal?: AbortSignal }) {
    const config = options?.signal ? { signal: options.signal } : {}
    const response = await api.post<{
      success: true
      message: string
      data: {
        topicId: string
        topicName: string
        level: string
        difficulty: string
        count: number
        vocabularies: any[]
      }
    }>('/admin/ai/generate-vocabularies', payload, config)
    return response.data.data
  },

  async generateQuestions(payload: GenerateQuestionsPayload, options?: { signal?: AbortSignal }) {
    const config = options?.signal ? { signal: options.signal } : {}
    const response = await api.post<{
      success: true
      message: string
      data: {
        topicId: string
        topicName: string
        count: number
        questions: any[]
      }
    }>('/admin/ai/generate-questions', payload, config)
    return response.data.data
  },

  async bulkPublishVocabularies(ids: string[]) {
    const response = await api.post<{
      success: true
      message: string
      data: { modifiedCount: number }
    }>('/admin/ai/vocabularies/bulk-publish', { ids })
    return response.data.data
  },

  async bulkPublishQuestions(ids: string[]) {
    const response = await api.post<{
      success: true
      message: string
      data: { modifiedCount: number }
    }>('/admin/ai/questions/bulk-publish', { ids })
    return response.data.data
  },

  async bulkDeleteVocabularies(ids: string[]) {
    const response = await api.post<{
      success: true
      message: string
      data: { deletedCount: number }
    }>('/admin/ai/vocabularies/bulk-delete', { ids })
    return response.data.data
  },

  async bulkDeleteQuestions(ids: string[]) {
    const response = await api.post<{
      success: true
      message: string
      data: { deletedCount: number }
    }>('/admin/ai/questions/bulk-delete', { ids })
    return response.data.data
  },
}
