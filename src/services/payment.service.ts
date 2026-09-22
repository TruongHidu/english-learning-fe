import api from '../api/axios'
import type { ApiSuccess } from '../types/api.types'
import type { RetryCheckoutData, SepayCheckoutData } from '../types/payment.types'
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
  async retryPayment(paymentId: string, signal?: AbortSignal): Promise<RetryCheckoutData> {
    return (await api.post<ApiSuccess<RetryCheckoutData>>(`/payments/${encodeURIComponent(paymentId)}/retry`, {}, { timeout: 15_000, ...(signal ? { signal } : {}) })).data.data
  },
  async cancelPayment(paymentId: string, signal?: AbortSignal): Promise<PaymentDetail> {
    return (await api.post<PaymentDetailApiResponse>(`/payments/${encodeURIComponent(paymentId)}/cancel`, {}, { timeout: 15_000, ...(signal ? { signal } : {}) })).data.data
  },
  async checkout(packageId: string): Promise<CheckoutResponse> {
    const response = await api.post<CheckoutApiResponse>(
      '/payments/vnpay/checkout',
      { packageId },
      { timeout: 15_000 },
    )
    return response.data.data
  },

  checkoutVnpay(packageId: string) {
    return paymentService.checkout(packageId)
  },
  async checkoutSepay(packageId: string, signal?: AbortSignal): Promise<SepayCheckoutData> {
    return (await api.post<ApiSuccess<SepayCheckoutData>>('/payments/sepay/checkout',
      { packageId }, { timeout: 15_000, signal })).data.data
  },
  getPaymentHistory(page = 1, limit = 20, signal?: AbortSignal) {
    return paymentService.getHistory(page, limit, signal)
  },

  async getPayment(paymentId: string, signal?: AbortSignal): Promise<PaymentDetail> {
    const response = await api.get<PaymentDetailApiResponse>(
      `/payments/${encodeURIComponent(paymentId)}`,
      { signal, timeout: 15_000 },
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
