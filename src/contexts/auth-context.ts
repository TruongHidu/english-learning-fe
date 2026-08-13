import { createContext } from 'react'
import type { AuthUser, LoginRequest } from '../types/auth.types'

export type AuthUserCachePatch = Partial<
  Pick<AuthUser, 'displayName' | 'avatarUrl' | 'role' | 'stats'>
>

export interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isInitializing: boolean
  login(input: LoginRequest): Promise<void>
  updateCachedUser(patch: AuthUserCachePatch): void
  logout(): void
}

export const AuthContext = createContext<AuthState | null>(null)
