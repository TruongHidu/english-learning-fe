import type { AuthSession } from '../types/auth.types'

export const AUTH_STORAGE_KEY = 'lingofox.auth.session'
export const AUTH_INVALIDATED_EVENT = 'lingofox:auth-invalidated'
export const AUTH_TOKEN_CHANGED_EVENT = 'lingofox:token-changed'
let session: AuthSession | null = null
let token: string | null = null
let generation = 0

// Remove credentials left by the previous version; never restore them.
try { localStorage.removeItem(AUTH_STORAGE_KEY) } catch { /* Storage unavailable. */ }

export const authStorage = {
  getSession: () => session,
  getAccessToken: () => token,
  getGeneration: () => generation,
  setAccessToken(value: string) {
    token = value
    if (session) session = { ...session, accessToken: value }
    window.dispatchEvent(new Event(AUTH_TOKEN_CHANGED_EVENT))
  },
  saveSession(value: AuthSession) {
    session = value
    this.setAccessToken(value.accessToken)
  },
  clear() {
    generation++
    session = null
    token = null
    window.dispatchEvent(new Event(AUTH_TOKEN_CHANGED_EVENT))
  },
}
