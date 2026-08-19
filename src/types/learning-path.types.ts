import type { ApiSuccess } from './api.types'

export type LessonProgressStatus = 'LOCKED' | 'UNLOCKED' | 'IN_PROGRESS' | 'COMPLETED'

export interface UserTopic {
  id: string
  sectionId: string
  name: string
  description: string | null
  orderIndex: number
  lessonCount: number
}

export interface LearningPathLesson {
  id: string
  name: string
  description: string | null
  orderIndex: number
  requiredScore: number
  questionCount: number
  xpReward: number
  diamondReward: number
  progressStatus: LessonProgressStatus
  isLocked: boolean
  bestScore: number
  totalAttempts: number
}

export interface TopicLearningPath {
  topic: Pick<UserTopic, 'id' | 'name' | 'description'>
  lessons: LearningPathLesson[]
}

export type GetTopicsBySectionResponse = ApiSuccess<{ topics: UserTopic[] }>
export type GetTopicLearningPathResponse = ApiSuccess<TopicLearningPath>
