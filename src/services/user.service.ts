import api from '../api/axios'
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  GetProfileResponse,
  UpdatedDisplayNameUser,
  UpdateDisplayNameRequest,
  UpdateDisplayNameResponse,
  UserProfile,
} from '../types/user.types'

export const userService = {
  async getProfile(): Promise<UserProfile> {
    const response = await api.get<GetProfileResponse>('/users/me')
    return response.data.data.user
  },

  async updateDisplayName(input: UpdateDisplayNameRequest): Promise<UpdatedDisplayNameUser> {
    const response = await api.patch<UpdateDisplayNameResponse>('/users/me/name', input)
    return response.data.data.user
  },

  async changePassword(input: ChangePasswordRequest): Promise<void> {
    await api.patch<ChangePasswordResponse>('/users/me/password', input)
  },

  async getLearnedVocabularies() {
    const response = await api.get<{ success: true; message: string; data: { vocabularies: any[] } }>('/users/vocabularies')
    return response.data.data.vocabularies
  },

  async getVocabulariesBySections() {
    const response = await api.get<{ success: true; message: string; data: { sections: any[] } }>('/users/vocabularies/by-sections')
    return response.data.data.sections
  },

  async getTopicVocabularies(topicId: string) {
    const response = await api.get<{ success: true; message: string; data: { topicGroup: any } }>(`/users/topics/${topicId}/vocabularies`)
    return response.data.data.topicGroup
  },

  async getLessonVocabularies(lessonId: string) {
    const response = await api.get<{ success: true; message: string; data: { lessonGroup: any } }>(`/users/lessons/${lessonId}/vocabularies`)
    return response.data.data.lessonGroup
  },
}




