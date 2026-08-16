import api from '../api/axios'
import type { ContentStatus } from '../types/course.types'
import type {
  CreateTopicInput,
  EmptyTopicMutationResponse,
  GetAdminTopicResponse,
  GetAdminTopicsBySectionResponse,
  TopicResponse,
  UpdateTopicInput,
} from '../types/topic.types'

export const adminTopicService = {
  async getTopicsBySection(sectionId: string): Promise<TopicResponse[]> {
    const response = await api.get<GetAdminTopicsBySectionResponse>(`/admin/sections/${sectionId}/topics`)
    return response.data.data.topics
  },

  async getTopicById(topicId: string): Promise<TopicResponse> {
    const response = await api.get<GetAdminTopicResponse>(`/admin/topics/${topicId}`)
    return response.data.data.topic
  },

  async createTopic(sectionId: string, input: CreateTopicInput): Promise<TopicResponse> {
    const body: CreateTopicInput = {
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      orderIndex: input.orderIndex,
      status: input.status,
    }
    const response = await api.post<GetAdminTopicResponse>(`/admin/sections/${sectionId}/topics`, body)
    return response.data.data.topic
  },

  async updateTopic(topicId: string, input: UpdateTopicInput): Promise<TopicResponse> {
    const body: UpdateTopicInput = {}
    if (input.name !== undefined) body.name = input.name.trim()
    if (input.description !== undefined) body.description = input.description.trim()
    const response = await api.patch<GetAdminTopicResponse>(`/admin/topics/${topicId}`, body)
    return response.data.data.topic
  },

  async updateTopicStatus(topicId: string, status: ContentStatus): Promise<TopicResponse> {
    const response = await api.patch<GetAdminTopicResponse>(`/admin/topics/${topicId}/status`, { status })
    return response.data.data.topic
  },

  async deleteTopic(topicId: string): Promise<void> {
    await api.delete<EmptyTopicMutationResponse>(`/admin/topics/${topicId}`)
  },

  async reorderTopics(sectionId: string, topicIds: string[]): Promise<void> {
    if (topicIds.length === 0) throw new Error('Danh sách Topic không được để trống.')
    await api.patch<EmptyTopicMutationResponse>(`/admin/sections/${sectionId}/topics/reorder`, { topicIds })
  },
}
