import api from '../api/axios'
import type { GetTopicLearningPathResponse, GetTopicsBySectionResponse, TopicLearningPath, UserTopic } from '../types/learning-path.types'

export const learningPathService = {
  async getTopicsBySection(sectionId: string): Promise<UserTopic[]> {
    const response = await api.get<GetTopicsBySectionResponse>(`/sections/${sectionId}/topics`)
    return response.data.data.topics
  },

  async getLessonsByTopic(topicId: string): Promise<TopicLearningPath> {
    const response = await api.get<GetTopicLearningPathResponse>(`/topics/${topicId}/lessons`)
    return response.data.data
  },
}
