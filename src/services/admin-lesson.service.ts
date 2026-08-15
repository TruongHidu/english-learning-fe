import api from '../api/axios'
import type { GetAdminLessonResponse, GetAdminLessonsByTopicResponse, LessonResponse } from '../types/lesson.types'

export const adminLessonService = {
  async getLessonsByTopic(topicId: string): Promise<LessonResponse[]> {
    const response = await api.get<GetAdminLessonsByTopicResponse>(`/admin/topics/${topicId}/lessons`)
    return response.data.data.lessons
  },

  async getLessonById(lessonId: string): Promise<LessonResponse> {
    const response = await api.get<GetAdminLessonResponse>(`/admin/lessons/${lessonId}`)
    return response.data.data.lesson
  }
}
