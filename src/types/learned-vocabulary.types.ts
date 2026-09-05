import type { ApiSuccess } from './api.types'

export type LearnedStatus = 'LEARNED' | 'MASTERED'

export interface LearnedVocabulary {
  id: string
  vocabulary: {
    id: string
    word: string
    meaning: string
    phonetic?: string | null
    example?: string | null
    audioUrl?: string | null
    imageUrl?: string | null
  }
  topicId: string
  lessonId: string
  status: LearnedStatus
  excludedFromReview: boolean
  learnedAt: string
  lastReviewedAt?: string | null
  reviewLevel: number
  reviewCount: number
  correctCount: number
  incorrectCount: number
  nextReviewAt: string
}

export interface UserVocabularyGroupedByLesson {
  lessonId: string
  lessonName: string
  vocabularies: LearnedVocabulary[]
}

export type LearnedVocabulariesGroupedResponse = ApiSuccess<UserVocabularyGroupedByLesson[]>

export type ExcludeFromReviewResponse = ApiSuccess<LearnedVocabulary>
