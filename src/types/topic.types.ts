import type { ContentStatus } from './course.types'

export interface TopicResponse {
  id: string
  sectionId: string
  name: string
  description: string | null
  orderIndex: number
  status: ContentStatus
  createdAt: string
  updatedAt: string
}

export interface GetAdminTopicResponse {
  success: true
  message: string
  data: {
    topic: TopicResponse
  }
}

export interface GetAdminTopicsBySectionResponse {
  success: true
  message: string
  data: {
    topics: TopicResponse[]
  }
}
