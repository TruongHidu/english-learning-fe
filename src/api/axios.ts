import axios from 'axios'
import { normalizeApiError } from './api-error'
import { AUTH_INVALIDATED_EVENT, authStorage } from '../utils/auth-storage'
import { refreshAccessToken } from './refresh'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type')
  }

  const accessToken = authStorage.getAccessToken()
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  } else {
    config.headers.delete('Authorization')
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const apiError = normalizeApiError(error)
    const invalidAuth = apiError.status !== 403 && (
      apiError.status === 401 ||
      apiError.code === 'UNAUTHORIZED' ||
      apiError.code === 'INVALID_TOKEN')

    const config = axios.isAxiosError(error) ? error.config : undefined
    const request = config as (typeof config & { _authRetried?: boolean })
    const authEndpoint = /\/auth\/(login|register|refresh|logout)(?:[/?]|$)/.test(config?.url ?? '')
    if (invalidAuth && !authEndpoint && request && !request._authRetried) {
      request._authRetried = true
      try {
        const current = authStorage.getAccessToken()
        const sent = request.headers.get('Authorization')
        const token = current && sent !== `Bearer ${current}` ? current : await refreshAccessToken()
        request.headers.set('Authorization', `Bearer ${token}`)
        return api.request(request)
      } catch {
        authStorage.clear()
        window.dispatchEvent(new Event(AUTH_INVALIDATED_EVENT))
        return Promise.reject(apiError)
      }
    }
    if (invalidAuth && !authEndpoint) {
      authStorage.clear()
      window.dispatchEvent(new Event(AUTH_INVALIDATED_EVENT))
    }

    return Promise.reject(apiError)
  },
)

export default api
