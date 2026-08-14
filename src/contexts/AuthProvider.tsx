import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth.service'
import type { AuthSession, AuthUser, LoginRequest } from '../types/auth.types'
import {
  AUTH_INVALIDATED_EVENT,
  AUTH_STORAGE_KEY,
  authStorage,
} from '../utils/auth-storage'
import { AuthContext } from './auth-context'
import type { AuthUserCachePatch } from './auth-context'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate()
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  const restoreSession = useCallback(() => {
    const session = authStorage.getSession()
    setAccessToken(session?.accessToken ?? null)
    setUser(session?.user ?? null)
    setIsInitializing(false)
  }, [])

  useEffect(() => {
    restoreSession()

    function handleStorage(event: StorageEvent) {
      if (event.key === AUTH_STORAGE_KEY) restoreSession()
    }

    function handleInvalidatedAuth() {
      setAccessToken(null)
      setUser(null)
      setIsInitializing(false)
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(AUTH_INVALIDATED_EVENT, handleInvalidatedAuth)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(AUTH_INVALIDATED_EVENT, handleInvalidatedAuth)
    }
  }, [restoreSession])

  const login = useCallback(async (input: LoginRequest): Promise<AuthUser> => {
    const response = await authService.login(input)
    const session: AuthSession = {
      accessToken: response.data.accessToken,
      user: response.data.user,
    }

    authStorage.saveSession(session)
    setAccessToken(session.accessToken)
    setUser(session.user)
    return session.user
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setAccessToken(null)
    setUser(null)
    navigate('/login', { replace: true })
  }, [navigate])

  const updateCachedUser = useCallback((patch: AuthUserCachePatch) => {
    setUser((currentUser) =>
      currentUser
        ? {
            ...currentUser,
            ...patch,
          }
        : currentUser,
    )
  }, [])

  useEffect(() => {
    if (!accessToken || !user) return
    authStorage.saveSession({ accessToken, user })
  }, [accessToken, user])

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(accessToken && user),
      isInitializing,
      login,
      updateCachedUser,
      logout,
    }),
    [accessToken, isInitializing, login, logout, updateCachedUser, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
