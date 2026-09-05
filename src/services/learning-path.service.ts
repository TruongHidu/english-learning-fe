import api from '../api/axios'
import type {
  GetTopicLearningPathResponse,
  GetTopicsBySectionResponse,
  SectionTopicLearningPath,
  TopicLearningPath,
  UserTopic,
} from '../types/learning-path.types'

export const learningPathService = {
  async getTopicsBySection(sectionId: string): Promise<UserTopic[]> {
    const response = await api.get<GetTopicsBySectionResponse>(`/sections/${sectionId}/topics`)
    return [...response.data.data.topics].sort(
      (first, second) => first.orderIndex - second.orderIndex,
    )
  },

  async getLessonsByTopic(topicId: string): Promise<TopicLearningPath> {
    const response = await api.get<GetTopicLearningPathResponse>(`/topics/${topicId}/lessons`)
    const path = response.data.data
    return {
      ...path,
      lessons: [...path.lessons].sort(
        (first, second) => first.orderIndex - second.orderIndex,
      ),
    }
  },

  async getSectionLearningPath(
    sectionId: string,
  ): Promise<SectionTopicLearningPath[]> {
    const topics = await this.getTopicsBySection(sectionId)
    const topicPaths = await Promise.all(
      topics.map((topic) => this.getLessonsByTopic(topic.id)),
    )

    return topics.map((topic, index) => ({
      topic: {
        ...topic,
        ...topicPaths[index].topic,
        sectionId: topic.sectionId,
        orderIndex: topic.orderIndex,
        lessonCount: topic.lessonCount,
      },
      lessons: topicPaths[index].lessons,
    }))
  },
}
