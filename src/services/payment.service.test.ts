import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api/axios'
import { paymentService } from './payment.service'

vi.mock('../api/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

describe('paymentService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('checkout chỉ gửi packageId lên backend', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        success: true,
        message: 'Tạo thanh toán thành công',
        data: {
          paymentId: 'aaaaaaaaaaaaaaaaaaaaaaaa',
          transactionCode: 'PAY001',
          status: 'PENDING',
          paymentUrl: 'https://sandbox.vnpayment.vn/payment',
          expiresAt: '2026-09-07T05:15:00.000Z',
        },
      },
    })

    await paymentService.checkout('bbbbbbbbbbbbbbbbbbbbbbbb')

    expect(api.post).toHaveBeenCalledWith(
      '/payments/vnpay/checkout',
      { packageId: 'bbbbbbbbbbbbbbbbbbbbbbbb' },
      { timeout: 15_000 },
    )
  })
})
