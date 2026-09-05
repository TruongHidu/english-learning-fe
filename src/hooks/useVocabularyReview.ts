import { useState, useCallback, useEffect } from 'react'
import { vocabularyReviewService } from '../services/vocabulary-review.service'
import type { ReviewDueQuery, ReviewResultInput, LearnedVocabulary } from '../types/vocabulary-review.types'
import { useAuth } from './useAuth'

export function useDueVocabularies(query?: ReviewDueQuery) {
  const [items, setItems] = useState<LearnedVocabulary[]>([])
  const [totalDue, setTotalDue] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const queryStr = JSON.stringify(query)

  const fetchDue = useCallback(async (params?: ReviewDueQuery) => {
    setIsLoading(true)
    setError(null)
    try {
      const q = params || (queryStr ? JSON.parse(queryStr) : undefined)
      const response = await vocabularyReviewService.getDue(q)
      setItems(response.data.items)
      setTotalDue(response.data.totalDue)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra khi tải danh sách ôn tập')
    } finally {
      setIsLoading(false)
    }
  }, [queryStr])

  useEffect(() => {
    fetchDue()
  }, [fetchDue])

  return { items, totalDue, isLoading, error, refetch: fetchDue }
}

export function useReviewSession(query: ReviewDueQuery) {
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const queryStr = JSON.stringify(query)
  
  const fetchSession = useCallback(async (params?: ReviewDueQuery) => {
    setIsLoading(true)
    setError(null)
    try {
      const q = params || JSON.parse(queryStr)
      const response = await vocabularyReviewService.getSession(q)
      setItems(response.data.items)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra khi tạo phiên ôn tập')
    } finally {
      setIsLoading(false)
    }
  }, [queryStr])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  return { items, isLoading, error, refetch: fetchSession }
}

export function useSubmitReviewResults() {
  const { updateCachedUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(async (results: ReviewResultInput[]) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await vocabularyReviewService.submitResults({ results })
      
      // Update XP if rewards were given
      if (response.data.rewards) {
        updateCachedUser({
          stats: {
            totalXp: response.data.rewards.totalXp,
            level: response.data.rewards.level,
            currentStreak: response.data.rewards.currentStreak,
          }
        })
      }
      
      return response.data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra khi gửi kết quả')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [updateCachedUser])

  return { submit, isLoading, error }
}

export function useReviewStats() {
  const [stats, setStats] = useState({ dueToday: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await vocabularyReviewService.getStats()
      setStats(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra khi lấy thống kê')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, isLoading, error, refetch: fetchStats }
}
