import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth.service'
import { userService } from '../services/user.service'
import type { AuthSession, AuthUser, LoginRequest } from '../types/auth.types'
import {
  AUTH_INVALIDATED_EVENT,
  AUTH_STORAGE_KEY,
  authStorage,
} from '../utils/auth-storage'
import { AuthContext } from './auth-context'
import type { AuthUserCachePatch } from './auth-context'
import { queryClient } from '../lib/queryClient'

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

  const updateCachedUser = useCallback((patch: AuthUserCachePatch) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser

      const { stats, ...userPatch } = patch
      return {
        ...currentUser,
        ...userPatch,
        stats: stats
          ? {
              ...currentUser.stats,
              ...stats,
            }
          : currentUser.stats,
      }
    })
  }, [])

  // Background refresh profile from DB whenever accessToken is present
  useEffect(() => {
    if (!accessToken) return
    let isMounted = true

    userService
      .getProfile()
      .then((profile) => {
        if (isMounted && profile?.stats) {
          updateCachedUser({ stats: profile.stats })
        }
      })
      .catch(() => {
        // ignore background sync errors
      })

    return () => {
      isMounted = false
    }
  }, [accessToken, updateCachedUser])

  // Real-time SSE and BroadcastChannel synchronization
  useEffect(() => {
    if (!accessToken || !user) return

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'
    let es: EventSource | null = null

    try {
      es = new EventSource(`${baseUrl}/users/events?token=${encodeURIComponent(accessToken)}`)

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (payload?.type === 'DIAMOND_UPDATED' && payload?.diamond !== undefined) {
            updateCachedUser({
              stats: {
                diamond: payload.diamond,
              },
            })
            window.dispatchEvent(new CustomEvent('DIAMOND_UPDATED', { detail: payload }))
          } else if (payload?.type === 'DIAMOND_PACKAGE_UPDATED') {
            void queryClient.invalidateQueries({ queryKey: ['shop'] })
            void queryClient.invalidateQueries({ queryKey: ['admin-diamond-packages'] })
            try {
              bc?.postMessage(payload)
            } catch {
              // ignore
            }
          }
        } catch {
          // ignore keep-alive or JSON parse errors
        }
      }
    } catch (err) {
      console.error('SSE initialization error:', err)
    }

    // Cross-tab real-time sync via BroadcastChannel
    let bc: BroadcastChannel | null = null
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('lingofox_realtime')
        bc.onmessage = (event) => {
          const payload = event.data
          if (payload?.type === 'DIAMOND_UPDATED' && payload?.diamond !== undefined) {
            if (!payload.userId || payload.userId === user.id) {
              updateCachedUser({
                stats: {
                  diamond: payload.diamond,
                },
              })
              window.dispatchEvent(new CustomEvent('DIAMOND_UPDATED', { detail: payload }))
            }
          } else if (payload?.type === 'DIAMOND_PACKAGE_UPDATED') {
            void queryClient.invalidateQueries({ queryKey: ['shop'] })
            void queryClient.invalidateQueries({ queryKey: ['admin-diamond-packages'] })
            // Anti-loop: strictly DO NOT post back to BroadcastChannel
          }
        }
      } catch {
        // ignore
      }
    }

    return () => {
      es?.close()
      bc?.close()
    }
  }, [accessToken, user, updateCachedUser])

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
