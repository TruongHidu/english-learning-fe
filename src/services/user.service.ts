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
}
