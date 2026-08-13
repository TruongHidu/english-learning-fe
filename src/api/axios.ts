import axios from 'axios'
import { normalizeApiError } from './api-error'
import { AUTH_INVALIDATED_EVENT, authStorage } from '../utils/auth-storage'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const accessToken = authStorage.getAccessToken()
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = normalizeApiError(error)
    const invalidAuth =
      apiError.status === 401 ||
      apiError.code === 'UNAUTHORIZED' ||
      apiError.code === 'INVALID_TOKEN'

    if (invalidAuth) {
      authStorage.clear()
      window.dispatchEvent(new Event(AUTH_INVALIDATED_EVENT))
    }

    return Promise.reject(apiError)
  },
)

export default api
