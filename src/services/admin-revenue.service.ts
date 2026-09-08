import api from '../api/axios'
import type { AdminRevenueAnalytics } from '../types/admin-revenue.types'

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export const adminRevenueService = {
  async getAnalytics(): Promise<AdminRevenueAnalytics> {
    const res = await api.get<ApiResponse<AdminRevenueAnalytics>>('/admin/revenue/analytics')
    return res.data.data
  },
}
