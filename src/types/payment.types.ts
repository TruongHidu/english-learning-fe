import type { ApiSuccess } from './api.types'

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'EXPIRED'
export type PaymentMethod = 'VNPAY' | 'SEPAY'

export interface SepayCheckoutData {
  paymentId: string
  transactionCode: string
  paymentMethod: 'SEPAY'
  status: PaymentStatus
  amount: number
  currency: 'VND'
  qrUrl: string
  bankCode: string
  accountNumber: string
  accountName: string
  transferContent: string
  expiresAt: string
}

export type RetryCheckoutData = CheckoutResponse | SepayCheckoutData

export interface CheckoutResponse {
  paymentId: string
  transactionCode: string
  status: PaymentStatus
  paymentUrl: string
  expiresAt: string
}

export interface PaymentDetail {
  paymentId: string
  transactionCode: string
  packageName: string
  amount: number
  diamondAmount: number
  currency: 'VND'
  paymentMethod: PaymentMethod
  status: PaymentStatus
  createdAt: string
  paidAt: string | null
  expiresAt: string
}

export interface PaymentHistory {
  payments: PaymentDetail[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type CheckoutApiResponse = ApiSuccess<CheckoutResponse>
export type PaymentDetailApiResponse = ApiSuccess<PaymentDetail>
export type PendingPaymentApiResponse = ApiSuccess<PaymentDetail | null>
export type PaymentHistoryApiResponse = ApiSuccess<PaymentHistory>
