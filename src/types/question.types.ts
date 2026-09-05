import type { LessonResponse } from './lesson.types'
import type { VocabularyDifficulty } from './vocabulary.types'

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'MATCHING'
  | 'FILL_BLANK'
  | 'ORDER_SENTENCE'
  | 'TRANSLATION'
  | 'LISTENING'


export type QuestionStatus =
  | 'DRAFT'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'INACTIVE'

export interface QuestionOption {
  id?: string
  content: string
  imageUrl?: string | null
  isCorrect: boolean
  orderIndex: number
}

export interface MatchingPair {
  id?: string
  vocabularyId?: string | null
  leftValue: string
  rightValue: string
  orderIndex: number
}

export interface LinkedVocabularyItem {
  id: string
  word: string
  meaning: string
}

export interface QuestionResponse {
  id: string
  vocabularyId: string | null
  vocabularyIds?: string[] | null
  vocabularies?: LinkedVocabularyItem[] | null
  type: QuestionType
  content: string
  instruction: string | null
  correctAnswer: unknown | null
  options: QuestionOption[] | null
  matchingPairs: MatchingPair[] | null
  explanation: string | null
  difficulty: VocabularyDifficulty
  audioUrl: string | null
  imageUrl: string | null
  status: QuestionStatus
  createdByAi: boolean
  aiGenerationId: string | null
  createdAt: string
  updatedAt: string
}

export interface QuestionListItemResponse {
  id: string
  vocabularyId: string | null
  vocabularyIds?: string[] | null
  vocabularies?: LinkedVocabularyItem[] | null
  type: QuestionType
  content: string
  difficulty: VocabularyDifficulty
  status: QuestionStatus
  createdByAi: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateQuestionInput {
  vocabularyId?: string
  vocabularyIds?: string[]
  type: QuestionType
  content: string
  instruction?: string
  correctAnswer?: unknown
  options?: QuestionOption[]
  matchingPairs?: MatchingPair[]
  explanation?: string
  difficulty: VocabularyDifficulty
  audioUrl?: string | null
  imageUrl?: string | null
}

export interface UpdateQuestionInput {
  vocabularyId?: string
  vocabularyIds?: string[]
  type?: QuestionType
  content?: string
  instruction?: string
  correctAnswer?: unknown
  options?: QuestionOption[]
  matchingPairs?: MatchingPair[]
  explanation?: string
  difficulty?: VocabularyDifficulty
  audioUrl?: string | null
  imageUrl?: string | null
}

export interface QuestionFormSubmission {
  payload: CreateQuestionInput
  imageFile: File | null
  audioFile: File | null
  removeImage: boolean
  removeAudio: boolean
}

export interface QuestionMediaFieldErrors {
  image?: string
  audio?: string
}


export interface QuestionListQuery {
  page?: number
  limit?: number
  search?: string
  topicId?: string
  vocabularyId?: string
  type?: QuestionType
  difficulty?: VocabularyDifficulty
  status?: QuestionStatus
  createdByAi?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface LessonQuestionResponse {
  id: string
  lessonId: string
  questionId: string
  orderIndex: number
  question: QuestionResponse
}

export interface GetAdminQuestionsResponse {
  success: boolean
  message: string
  data: {
    questions: QuestionListItemResponse[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export interface GetAdminQuestionDetailResponse {
  success: boolean
  message: string
  data: {
    question: QuestionResponse
  }
}

export interface GetLessonQuestionsResponse {
  success: boolean
  message: string
  data: {
    questions: LessonQuestionResponse[]
  }
}

export interface AssignQuestionsToLessonRequest {
  questionIds: string[]
}

export interface AssignQuestionsToLessonResponseData {
  lesson: LessonResponse
  questions: LessonQuestionResponse[]
  assignedCount: number
  skippedCount: number
}

export interface AssignQuestionsToLessonResponse {
  success: true
  message: string
  data: AssignQuestionsToLessonResponseData
}

export interface PendingQuestionAssignment {
  topicId: string
  questionIds: string[]
  lessonId: string | null
}

export interface EmptyQuestionResponse {
  success: boolean
  message: string
  data: null
}
