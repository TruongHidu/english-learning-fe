import api from '../api/axios'
import type {
  CommitVocabularyApiResponse,
  CommitVocabularyRequest,
  CommitVocabularyResponse,
  GenerateVocabularyPreviewApiResponse,
  GenerateVocabularyPreviewRequest,
  GenerateVocabularyPreviewResponse,
  GetAiGenerationApiResponse,
  AiGenerationResponse,
  CommitQuestionApiResponse,
  CommitQuestionRequest,
  CommitQuestionResponse,
  GenerateQuestionPreviewApiResponse,
  GenerateQuestionPreviewRequest,
  GenerateQuestionPreviewResponse,
} from '../types/admin-ai.types'

function cleanOptionalText(value: string | undefined): string | undefined {
  const cleaned = value?.trim()
  return cleaned || undefined
}

function cleanCommitPayload(
  payload: CommitVocabularyRequest,
): CommitVocabularyRequest {
  return {
    items: payload.items.map((item) => ({
      candidateKey: item.candidateKey,
      word: item.word.trim(),
      meaning: item.meaning.trim(),
      phonetic: cleanOptionalText(item.phonetic),
      partOfSpeech: cleanOptionalText(item.partOfSpeech),
      example: cleanOptionalText(item.example),
      exampleMeaning: cleanOptionalText(item.exampleMeaning),
    })),
  }
}

export const adminAiService = {
  async generateVocabularyPreview(
    topicId: string,
    payload: GenerateVocabularyPreviewRequest,
    options?: { signal?: AbortSignal },
  ): Promise<GenerateVocabularyPreviewResponse> {
    const config = options?.signal ? { signal: options.signal } : {}
    const response = await api.post<GenerateVocabularyPreviewApiResponse>(
      `/admin/topics/${topicId}/ai/vocabularies/generate`,
      payload,
      config,
    )
    return response.data.data
  },

  async commitVocabularyGeneration(
    generationId: string,
    payload: CommitVocabularyRequest,
    options?: { signal?: AbortSignal },
  ): Promise<CommitVocabularyResponse> {
    const config = options?.signal ? { signal: options.signal } : {}
    const response = await api.post<CommitVocabularyApiResponse>(
      `/admin/ai/generations/${generationId}/vocabularies/commit`,
      cleanCommitPayload(payload),
      config,
    )
    return response.data.data
  },

  async getGeneration(generationId: string): Promise<AiGenerationResponse> {
    const response = await api.get<GetAiGenerationApiResponse>(
      `/admin/ai/generations/${generationId}`,
    )
    return response.data.data.generation
  },

  async generateQuestionPreview(
    topicId: string,
    payload: GenerateQuestionPreviewRequest,
    options?: { signal?: AbortSignal },
  ): Promise<GenerateQuestionPreviewResponse> {
    const config = options?.signal ? { signal: options.signal } : {}
    const response = await api.post<GenerateQuestionPreviewApiResponse>(
      `/admin/topics/${topicId}/ai/questions/generate`,
      payload,
      config,
    )
    return response.data.data
  },

  async commitQuestionGeneration(
    generationId: string,
    payload: CommitQuestionRequest,
    options?: { signal?: AbortSignal },
  ): Promise<CommitQuestionResponse> {
    const config = options?.signal ? { signal: options.signal } : {}
    const response = await api.post<CommitQuestionApiResponse>(
      `/admin/ai/generations/${generationId}/questions/commit`,
      payload,
      config,
    )
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
