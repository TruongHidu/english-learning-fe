import type { ApiSuccess } from './api.types'

export interface LearnedVocabulary {
  id: string
  word: string
  meaning: string
  phonetic?: string | null
  example?: string | null
  audioUrl?: string | null
  imageUrl?: string | null
}

export interface ReviewDueQuery {
  topicId?: string
  limit?: number
  forceAll?: boolean
}

export type ReviewDueResponse = ApiSuccess<{
  items: LearnedVocabulary[]
  totalDue: number
}>

export type ReviewSessionResponse = ApiSuccess<{
  items: any[]
}>

export interface ReviewResultInput {
  vocabularyId: string
  isCorrect: boolean
}

export interface SubmitReviewResultsRequest {
  results: ReviewResultInput[]
}

export type SubmitReviewResultsResponse = ApiSuccess<{
  results: LearnedVocabulary[]
  rewards?: {
    xpEarned: number
    totalXp: number
    level: number
    currentStreak: number
  } | null
}>

export type ReviewStatsResponse = ApiSuccess<{
  dueToday: number
}>
