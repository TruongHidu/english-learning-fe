import api from '../api/axios'
import type { ContentStatus } from '../types/course.types'
import type {
  CreateLessonInput,
  EmptyLessonMutationResponse,
  GetAdminLessonResponse,
  GetAdminLessonsByTopicResponse,
  LessonResponse,
  UpdateLessonInput,
} from '../types/lesson.types'

export const adminLessonService = {
  async getLessonsByTopic(topicId: string): Promise<LessonResponse[]> {
    const response = await api.get<GetAdminLessonsByTopicResponse>(`/admin/topics/${topicId}/lessons`)
    return response.data.data.lessons
  },

  async getLessonById(lessonId: string): Promise<LessonResponse> {
    const response = await api.get<GetAdminLessonResponse>(`/admin/lessons/${lessonId}`)
    return response.data.data.lesson
  },

  async createLesson(topicId: string, input: CreateLessonInput): Promise<LessonResponse> {
    const body: CreateLessonInput = {
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      requiredScore: input.requiredScore,
      questionCount: input.questionCount,
      xpReward: input.xpReward,
      diamondReward: input.diamondReward,
      orderIndex: input.orderIndex,
      status: input.status,
    }
    const response = await api.post<GetAdminLessonResponse>(`/admin/topics/${topicId}/lessons`, body)
    return response.data.data.lesson
  },

  async updateLesson(lessonId: string, input: UpdateLessonInput): Promise<LessonResponse> {
    const body: UpdateLessonInput = {}
    if (input.name !== undefined) body.name = input.name.trim()
    if (input.description !== undefined) body.description = input.description.trim()
    if (input.requiredScore !== undefined) body.requiredScore = input.requiredScore
    if (input.questionCount !== undefined) body.questionCount = input.questionCount
    if (input.xpReward !== undefined) body.xpReward = input.xpReward
    if (input.diamondReward !== undefined) body.diamondReward = input.diamondReward
    const response = await api.patch<GetAdminLessonResponse>(`/admin/lessons/${lessonId}`, body)
    return response.data.data.lesson
  },

  async updateLessonStatus(lessonId: string, status: ContentStatus): Promise<LessonResponse> {
    const response = await api.patch<GetAdminLessonResponse>(`/admin/lessons/${lessonId}/status`, { status })
    return response.data.data.lesson
  },

  async deleteLesson(lessonId: string): Promise<void> {
    await api.delete<EmptyLessonMutationResponse>(`/admin/lessons/${lessonId}`)
  },

  async reorderLessons(topicId: string, lessonIds: string[]): Promise<void> {
    if (lessonIds.length === 0) throw new Error('Danh sách Lesson không được để trống.')
    await api.patch<EmptyLessonMutationResponse>(`/admin/topics/${topicId}/lessons/reorder`, { lessonIds })
  },
}
