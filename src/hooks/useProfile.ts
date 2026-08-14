import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from './useAuth'
import { userService } from '../services/user.service'
import type { UpdatedDisplayNameUser, UserProfile } from '../types/user.types'
import { getProfileErrorMessage } from '../utils/user-errors'

export function useProfile() {
  const { updateCachedUser } = useAuth()
  const requestIdRef = useRef(0)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setError(null)
    setProfile(null)

    try {
      const nextProfile = await userService.getProfile()
      if (requestId !== requestIdRef.current) return

      setProfile(nextProfile)
      updateCachedUser({
        displayName: nextProfile.displayName,
        avatarUrl: nextProfile.avatarUrl,
        role: nextProfile.role,
        stats: {
          currentHeart: nextProfile.stats.currentHeart,
          maxHeart: nextProfile.stats.maxHeart,
          diamond: nextProfile.stats.diamond,
          totalXp: nextProfile.stats.totalXp,
          level: nextProfile.stats.level,
          currentStreak: nextProfile.stats.currentStreak,
        },
      })
    } catch (requestError) {
      if (requestId !== requestIdRef.current) return
      setProfile(null)
      setError(getProfileErrorMessage(requestError))
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false)
    }
  }, [updateCachedUser])

  useEffect(() => {
    void loadProfile()
    return () => {
      requestIdRef.current += 1
    }
  }, [loadProfile])

  const mergeUpdatedName = useCallback(
    (updatedUser: UpdatedDisplayNameUser) => {
      setProfile((currentProfile) =>
        currentProfile
          ? {
              ...currentProfile,
              displayName: updatedUser.displayName,
              avatarUrl: updatedUser.avatarUrl,
            }
          : currentProfile,
      )
      updateCachedUser({
        displayName: updatedUser.displayName,
        avatarUrl: updatedUser.avatarUrl,
      })
    },
    [updateCachedUser],
  )

  return {
    profile,
    isLoading,
    error,
    retry: loadProfile,
    mergeUpdatedName,
  }
}
