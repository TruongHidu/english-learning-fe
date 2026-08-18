import type { ContentStatus } from './course.types'
import type { ApiSuccess } from './api.types'

export interface TopicResponse {
  id: string
  sectionId: string
  name: string
  description: string | null
  orderIndex: number
  status: ContentStatus
  lessonCount?: number
  createdAt: string
  updatedAt: string
}

export interface CreateTopicInput {
  name: string
  description?: string
  orderIndex?: number
  status?: ContentStatus
}

export interface UpdateTopicInput {
  name?: string
  description?: string
}

export type GetAdminTopicResponse = ApiSuccess<{ topic: TopicResponse }>
export type GetAdminTopicsBySectionResponse = ApiSuccess<{ topics: TopicResponse[] }>
export type EmptyTopicMutationResponse = ApiSuccess<null>
