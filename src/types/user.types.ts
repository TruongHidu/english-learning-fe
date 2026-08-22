import type { UserRole, UserStatus } from './auth.types'

export type AuthProvider = 'LOCAL' | 'GOOGLE'

export interface UserProfileStats {
  currentHeart: number
  maxHeart: number
  nextHeartAt?: string | null
  diamond: number
  totalXp: number
  level: number
  currentStreak: number
  longestStreak: number
}

export interface UserProfile {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  authProvider: AuthProvider
  role: UserRole
  status: UserStatus
  stats: UserProfileStats
  createdAt: string
}

export interface GetProfileResponse {
  success: true
  message: string
  data: {
    user: UserProfile
  }
}

export interface UpdateDisplayNameRequest {
  displayName: string
}

export interface UpdatedDisplayNameUser {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
}

export interface UpdateDisplayNameResponse {
  success: true
  message: string
  data: {
    user: UpdatedDisplayNameUser
  }
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface ChangePasswordResponse {
  success: true
  message: string
}

export interface LearnedVocabularyItem {
  id: string
  vocabularyId: string | null
  word: string
  meaning: string
  phonetic: string | null
  partOfSpeech: string | null
  example: string | null
  exampleMeaning: string | null
  audioUrl: string | null
  imageUrl: string | null
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  masteryLevel: number
  reviewCount: number
  learnedAt: string
  lastReviewedAt: string
}

export interface GetLearnedVocabulariesResponse {
  success: true
  message: string
  data: {
    vocabularies: LearnedVocabularyItem[]
  }
}

export interface SectionVocabularyItem {
  id: string
  vocabularyId: string
  word: string
  meaning: string
  phonetic: string | null
  partOfSpeech: string | null
  example: string | null
  exampleMeaning: string | null
  audioUrl: string | null
  imageUrl: string | null
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  isLearned: boolean
  masteryLevel: number
  reviewCount: number
  lastReviewedAt: string | null
}

export interface TopicVocabularyGroup {
  topicId: string
  topicName: string
  description: string | null
  totalVocabularies: number
  learnedCount: number
  unlearnedCount: number
  vocabularies: SectionVocabularyItem[]
}

export interface SectionVocabularyGroup {
  sectionId: string
  sectionName: string
  description: string | null
  orderIndex: number
  totalVocabularies: number
  learnedCount: number
  unlearnedCount: number
  topics: TopicVocabularyGroup[]
}


