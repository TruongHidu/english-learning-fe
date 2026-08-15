import type { ContentStatus } from './course.types'

export interface LessonResponse {
  id: string
  topicId: string
  name: string
  description: string | null
  orderIndex: number
  requiredScore: number
  questionCount: number
  xpReward: number
  diamondReward: number
  status: ContentStatus
  createdAt: string
  updatedAt: string
}

export interface GetAdminLessonResponse {
  success: true
  message: string
  data: {
    lesson: LessonResponse
  }
}

export interface GetAdminLessonsByTopicResponse {
  success: true
  message: string
  data: {
    lessons: LessonResponse[]
  }
}
