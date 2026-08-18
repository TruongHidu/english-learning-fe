import api from '../api/axios'
import type { ContentStatus } from '../types/course.types'
import type {
  CreateVocabularyInput,
  EmptyVocabularyResponse,
  GetAdminVocabulariesResponse,
  GetAdminVocabularyResponse,
  PaginatedVocabularyData,
  UpdateVocabularyInput,
  VocabularyListQuery,
  VocabularyResponse,
} from '../types/vocabulary.types'

export const adminVocabularyService = {
  async getVocabulariesByTopic(
    topicId: string,
    query?: VocabularyListQuery,
  ): Promise<PaginatedVocabularyData> {
    const response = await api.get<GetAdminVocabulariesResponse>(
      `/admin/topics/${topicId}/vocabularies`,
      { params: query },
    )
    return response.data.data
  },

  async getAllVocabularies(
    query?: VocabularyListQuery,
  ): Promise<PaginatedVocabularyData> {
    const response = await api.get<GetAdminVocabulariesResponse>(
      '/admin/vocabularies',
      { params: query },
    )
    return response.data.data
  },

  async getVocabularyById(vocabularyId: string): Promise<VocabularyResponse> {
    const response = await api.get<GetAdminVocabularyResponse>(
      `/admin/vocabularies/${vocabularyId}`,
    )
    return response.data.data.vocabulary
  },

  async createVocabulary(
    topicId: string,
    input: CreateVocabularyInput,
  ): Promise<VocabularyResponse> {
    const response = await api.post<GetAdminVocabularyResponse>(
      `/admin/topics/${topicId}/vocabularies`,
      input,
    )
    return response.data.data.vocabulary
  },

  async updateVocabulary(
    vocabularyId: string,
    input: UpdateVocabularyInput,
  ): Promise<VocabularyResponse> {
    const response = await api.patch<GetAdminVocabularyResponse>(
      `/admin/vocabularies/${vocabularyId}`,
      input,
    )
    return response.data.data.vocabulary
  },

  async updateVocabularyStatus(
    vocabularyId: string,
    status: ContentStatus,
  ): Promise<VocabularyResponse> {
    const response = await api.patch<GetAdminVocabularyResponse>(
      `/admin/vocabularies/${vocabularyId}/status`,
      { status },
    )
    return response.data.data.vocabulary
  },

  async deleteVocabulary(vocabularyId: string): Promise<void> {
    await api.delete<EmptyVocabularyResponse>(
      `/admin/vocabularies/${vocabularyId}`,
    )
  },
}
