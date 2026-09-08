import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api/axios'
import { adminRevenueService } from './admin-revenue.service'
import type { AdminRevenueAnalytics } from '../types/admin-revenue.types'

vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('adminRevenueService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('gọi đúng GET /admin/revenue/analytics và trả data', async () => {
    const mockData: AdminRevenueAnalytics = {
      summary: {
        totalRevenue: 500000,
        currentMonthRevenue: 200000,
        totalPayments: 5,
        successfulPayments: 3,
        pendingPayments: 1,
        failedPayments: 1,
        cancelledPayments: 0,
        expiredPayments: 0,
        completionRate: 60,
      },
      recentPayments: [],
      topPackages: [],
    }

    vi.mocked(api.get).mockResolvedValue({
      data: {
        success: true,
        message: 'Lấy thống kê doanh thu thành công',
        data: mockData,
      },
    })

    const result = await adminRevenueService.getAnalytics()
    expect(api.get).toHaveBeenCalledWith('/admin/revenue/analytics')
    expect(result).toEqual(mockData)
  })
})
