import api from '../api/axios'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '../types/auth.types'
import { authStorage } from '../utils/auth-storage'

export const authService = {
  async login(input: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', input)
    return response.data
  },

  async register(input: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/auth/register', input)
    return response.data
  },

  logout(): void {
    authStorage.clear()
  },
}
