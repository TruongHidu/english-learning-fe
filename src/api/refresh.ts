import axios from 'axios'
import { authStorage } from '../utils/auth-storage'

export const authApi = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL, withCredentials: true })
let pending: Promise<string> | null = null

export function withAuthCookieLock<T>(work: () => Promise<T>): Promise<T> {
  return typeof navigator !== 'undefined' && navigator.locks
    ? navigator.locks.request('lingofox-auth-refresh', work)
    : work()
}

export async function finishPendingRefresh(): Promise<void> {
  try { await pending } catch { /* A failed refresh must not prevent login/logout. */ }
}

export function refreshAccessToken(): Promise<string> {
  if (pending) return pending
  const generation = authStorage.getGeneration()
  const work = async () => {
    const { data } = await authApi.post<{ data: { accessToken: string } }>('/auth/refresh')
    if (generation !== authStorage.getGeneration()) throw new Error('Session changed during refresh')
    const token = data.data.accessToken
    if (!token || typeof token !== 'string') throw new Error('Invalid refresh response')
    authStorage.setAccessToken(token)
    return token
  }
  // Serialize rotations between tabs sharing the same HttpOnly cookie.
  pending = withAuthCookieLock(work).finally(() => { pending = null })
  return pending
}
