import type { UserRole, UserStatus } from './auth.types'

export type AuthProvider = 'LOCAL' | 'GOOGLE'

export interface UserProfileStats {
  currentHeart: number
  maxHeart: number
  diamond: number
  totalXp: number
  level: number
  currentStreak: number
  longestStreak: number
}

export interface UserProfile {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  authProvider: AuthProvider
  role: UserRole
  status: UserStatus
  stats: UserProfileStats
  createdAt: string
}

export interface GetProfileResponse {
  success: true
  message: string
  data: {
    user: UserProfile
  }
}

export interface UpdateDisplayNameRequest {
  displayName: string
}

export interface UpdatedDisplayNameUser {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
}

export interface UpdateDisplayNameResponse {
  success: true
  message: string
  data: {
    user: UpdatedDisplayNameUser
  }
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface ChangePasswordResponse {
  success: true
  message: string
}
