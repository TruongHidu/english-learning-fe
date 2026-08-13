import type { AuthSession, AuthUser, UserRole, UserStats } from '../types/auth.types'

export const AUTH_STORAGE_KEY = 'lingofox.auth.session'
export const AUTH_INVALIDATED_EVENT = 'lingofox:auth-invalidated'

let memorySession: AuthSession | null = null

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'USER' || value === 'ADMIN'
}

function isUserStats(value: unknown): value is UserStats {
  return (
    isRecord(value) &&
    typeof value.currentHeart === 'number' &&
    typeof value.maxHeart === 'number' &&
    typeof value.diamond === 'number' &&
    typeof value.totalXp === 'number' &&
    typeof value.level === 'number' &&
    typeof value.currentStreak === 'number'
  )
}

function isAuthUser(value: unknown): value is AuthUser {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.email === 'string' &&
    typeof value.displayName === 'string' &&
    (typeof value.avatarUrl === 'string' || value.avatarUrl === null) &&
    isUserRole(value.role) &&
    isUserStats(value.stats)
  )
}

function isAuthSession(value: unknown): value is AuthSession {
  return (
    isRecord(value) &&
    typeof value.accessToken === 'string' &&
    value.accessToken.length > 0 &&
    isAuthUser(value.user)
  )
}

function readSession(): AuthSession | null {
  try {
    const serializedSession = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!serializedSession) return memorySession

    const parsedSession: unknown = JSON.parse(serializedSession)
    if (isAuthSession(parsedSession)) {
      memorySession = parsedSession
      return parsedSession
    }

    localStorage.removeItem(AUTH_STORAGE_KEY)
    memorySession = null
    return null
  } catch {
    return memorySession
  }
}

export const authStorage = {
  getSession(): AuthSession | null {
    return readSession()
  },

  getAccessToken(): string | null {
    return readSession()?.accessToken ?? null
  },

  saveSession(session: AuthSession): void {
    memorySession = session
    try {
      // User chỉ là cache phục vụ auth/navbar; /users/me mới là nguồn profile đầy đủ.
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
    } catch {
      // Auth Context vẫn giữ session trong bộ nhớ nếu storage không khả dụng.
    }
  },

  clear(): void {
    memorySession = null
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    } catch {
      // Không có dữ liệu nhạy cảm nào khác cần xử lý nếu storage không khả dụng.
    }
  },
}
