import type { ContentStatus } from './course.types'

export type VocabularyDifficulty = 'EASY' | 'MEDIUM' | 'HARD'

export interface VocabularyResponse {
  id: string
  topicId: string
  word: string
  meaning: string
  phonetic: string | null
  partOfSpeech: string | null
  example: string | null
  exampleMeaning: string | null
  audioUrl: string | null
  imageUrl: string | null
  difficulty: VocabularyDifficulty
  status: ContentStatus
  createdByAi: boolean
  aiGenerationId: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateVocabularyInput {
  word: string
  meaning: string
  phonetic?: string
  partOfSpeech?: string
  example?: string
  exampleMeaning?: string
  audioUrl?: string
  imageUrl?: string
  difficulty?: VocabularyDifficulty
}

export interface UpdateVocabularyInput {
  word?: string
  meaning?: string
  phonetic?: string
  partOfSpeech?: string
  example?: string
  exampleMeaning?: string
  audioUrl?: string
  imageUrl?: string
  difficulty?: VocabularyDifficulty
}

export interface VocabularyListQuery {
  page?: number
  limit?: number
  search?: string
  difficulty?: VocabularyDifficulty
  status?: ContentStatus
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedVocabularyData {
  vocabularies: VocabularyResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface GetAdminVocabulariesResponse {
  success: boolean
  message: string
  data: PaginatedVocabularyData
}

export interface GetAdminVocabularyResponse {
  success: boolean
  message: string
  data: {
    vocabulary: VocabularyResponse
  }
}

export interface EmptyVocabularyResponse {
  success: boolean
  message: string
  data: null
}
