import api from '../api/axios'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '../types/auth.types'
import { authStorage } from '../utils/auth-storage'
import { authApi, finishPendingRefresh, withAuthCookieLock } from '../api/refresh'

export const authService = {
  async login(input: LoginRequest): Promise<LoginResponse> {
    await finishPendingRefresh()
    const response = await withAuthCookieLock(() => authApi.post<LoginResponse>('/auth/login', input))
    return response.data
  },

  async register(input: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/auth/register', input)
    return response.data
  },

  async logout(): Promise<void> {
    authStorage.clear()
    await finishPendingRefresh()
    try { await withAuthCookieLock(() => authApi.post('/auth/logout')) } catch { /* Local logout must always complete. */ }
  },
}
