import api from '../api/axios'
import type { GetAdminTopicResponse, GetAdminTopicsBySectionResponse, TopicResponse } from '../types/topic.types'

export const adminTopicService = {
  async getTopicsBySection(sectionId: string): Promise<TopicResponse[]> {
    const response = await api.get<GetAdminTopicsBySectionResponse>(`/admin/sections/${sectionId}/topics`)
    return response.data.data.topics
  },

  async getTopicById(topicId: string): Promise<TopicResponse> {
    const response = await api.get<GetAdminTopicResponse>(`/admin/topics/${topicId}`)
    return response.data.data.topic
  }
}
