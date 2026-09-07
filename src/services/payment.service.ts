import api from '../api/axios'
import type {
  CheckoutApiResponse,
  CheckoutResponse,
  PaymentDetail,
  PaymentDetailApiResponse,
  PaymentHistory,
  PaymentHistoryApiResponse,
  PendingPaymentApiResponse,
} from '../types/payment.types'

export const paymentService = {
  async getPendingPayment(signal?: AbortSignal): Promise<PaymentDetail | null> {
    return (await api.get<PendingPaymentApiResponse>('/payments/pending', { signal })).data.data
  },
  async retryPayment(paymentId: string): Promise<CheckoutResponse> {
    return (await api.post<CheckoutApiResponse>(`/payments/${encodeURIComponent(paymentId)}/retry`, {}, { timeout: 15_000 })).data.data
  },
  async cancelPayment(paymentId: string): Promise<PaymentDetail> {
    return (await api.post<PaymentDetailApiResponse>(`/payments/${encodeURIComponent(paymentId)}/cancel`, {}, { timeout: 15_000 })).data.data
  },
  async checkout(packageId: string): Promise<CheckoutResponse> {
    const response = await api.post<CheckoutApiResponse>(
      '/payments/vnpay/checkout',
      { packageId },
      { timeout: 15_000 },
    )
    return response.data.data
  },

  async getPayment(paymentId: string, signal?: AbortSignal): Promise<PaymentDetail> {
    const response = await api.get<PaymentDetailApiResponse>(
      `/payments/${encodeURIComponent(paymentId)}`,
      { signal },
    )
    return response.data.data
  },

  async getHistory(page = 1, limit = 20, signal?: AbortSignal): Promise<PaymentHistory> {
    const response = await api.get<PaymentHistoryApiResponse>('/payments/me', {
      params: { page, limit },
      signal,
    })
    return response.data.data
  },
}
