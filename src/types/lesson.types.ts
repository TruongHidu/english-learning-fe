import type { ContentStatus } from './course.types'
import type { ApiSuccess } from './api.types'

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

export interface CreateLessonInput {
  name: string
  description?: string
  orderIndex?: number
  requiredScore?: number
  questionCount?: number
  xpReward?: number
  diamondReward?: number
  status?: ContentStatus
}

export interface UpdateLessonInput {
  name?: string
  description?: string
  requiredScore?: number
  questionCount?: number
  xpReward?: number
  diamondReward?: number
}

export type GetAdminLessonResponse = ApiSuccess<{ lesson: LessonResponse }>
export type GetAdminLessonsByTopicResponse = ApiSuccess<{ lessons: LessonResponse[] }>
export type EmptyLessonMutationResponse = ApiSuccess<null>

export interface CreateLessonForAssignmentState {
  isOpen: boolean
  isSubmitting: boolean
  error: string | null
}
