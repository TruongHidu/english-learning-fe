import { useState, useCallback, useEffect } from 'react'
import { learnedVocabularyService } from '../services/learned-vocabulary.service'
import type { UserVocabularyGroupedByLesson } from '../types/learned-vocabulary.types'

export function useExcludeFromReview() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const excludeReview = useCallback(async (vocabularyId: string, exclude: boolean) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await learnedVocabularyService.excludeFromReview(vocabularyId, exclude)
      return response.data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { excludeReview, isLoading, error }
}

export function useLearnedVocabularies() {
  const [items, setItems] = useState<UserVocabularyGroupedByLesson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLearned = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await learnedVocabularyService.getLearnedVocabularies()
      setItems(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra khi tải danh sách')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLearned()
  }, [fetchLearned])

  return { items, isLoading, error, refetch: fetchLearned }
}
