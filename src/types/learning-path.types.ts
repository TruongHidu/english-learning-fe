import type { ApiSuccess } from './api.types'

export type ProgressStatus = 'LOCKED' | 'UNLOCKED' | 'IN_PROGRESS' | 'COMPLETED'
export type LessonProgressStatus = ProgressStatus

export interface UserTopic {
  id: string
  sectionId: string
  name: string
  description: string | null
  orderIndex: number
  lessonCount: number
  totalLessonCount: number
  progressStatus: ProgressStatus
  isLocked: boolean
  isCompleted: boolean
  hasAccess?: boolean
  accessGrantedAt?: string | null
  isCurrentVersionCompleted?: boolean
  hasNewContent?: boolean
  newLessonCount?: number
  completedLessonCount: number
}

export interface LearningPathLesson {
  currentVersion?: number
  completedVersion?: number
  publishedQuestionCount?: number
  isNewForUser?: boolean
  id: string
  name: string
  description: string | null
  orderIndex: number
  requiredScore: number
  questionCount: number
  xpReward: number
  diamondReward: number
  progressStatus: ProgressStatus
  isLocked: boolean
  isCompleted: boolean
  hasAccess?: boolean
  accessGrantedAt?: string | null
  isCurrentVersionCompleted?: boolean
  hasNewContent?: boolean
  newLessonCount?: number
  bestScore: number
  totalAttempts: number
}

export interface UserTopicSummary {
  id: string
  name: string
  description: string | null
  progressStatus: ProgressStatus
  isLocked: boolean
  isCompleted: boolean
  hasAccess?: boolean
  accessGrantedAt?: string | null
  isCurrentVersionCompleted?: boolean
  hasNewContent?: boolean
  newLessonCount?: number
  completedLessonCount: number
  totalLessonCount: number
}

export interface TopicLearningPath {
  topic: UserTopicSummary
  lessons: LearningPathLesson[]
}

export interface SectionTopicLearningPath {
  topic: UserTopic
  lessons: LearningPathLesson[]
}

export type GetTopicsBySectionResponse = ApiSuccess<{ topics: UserTopic[] }>
export type GetTopicLearningPathResponse = ApiSuccess<TopicLearningPath>
