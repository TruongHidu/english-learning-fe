import { useQuery } from '@tanstack/react-query'
import {
  adminLearningStatsService,
  type AdminLearningStatsQuery,
} from '../services/admin-learning-stats.service'

export function useAdminLearningStats(query?: AdminLearningStatsQuery) {
  return useQuery({
    queryKey: ['admin', 'learning-stats', 'analytics', query],
    queryFn: () => adminLearningStatsService.getAnalytics(query),
    staleTime: 60_000,
    retry: (failureCount, error: any) => {
      // Do not retry indefinitely on 401 or 403
      if (error?.status === 401 || error?.status === 403) return false
      return failureCount < 2
    },
  })
}
