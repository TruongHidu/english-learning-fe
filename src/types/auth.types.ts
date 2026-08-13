export type UserRole = 'USER' | 'ADMIN'

export type UserStatus = 'ACTIVE' | 'LOCKED' | 'BANNED'

export interface UserStats {
  currentHeart: number
  maxHeart: number
  diamond: number
  totalXp: number
  level: number
  currentStreak: number
}

export interface AuthUser {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  role: UserRole
  stats: UserStats
}

export interface RegisterRequest {
  email: string
  password: string
  displayName: string
}

export interface RegisteredUser {
  id: string
  email: string
  displayName: string
  role: UserRole
  status: UserStatus
}

export interface RegisterResponse {
  success: true
  message: string
  data: {
    user: RegisteredUser
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: true
  message: string
  data: {
    accessToken: string
    user: AuthUser
  }
}

export interface ApiFieldError {
  field: string
  message: string
}

export interface ApiErrorResponse {
  success: false
  message: string
  code: string
  errors?: ApiFieldError[]
}

export interface AuthSession {
  accessToken: string
  user: AuthUser
}
