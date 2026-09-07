import { isValidPaymentId } from './payment'

export const PENDING_PAYMENT_STORAGE_KEY = 'english-learning.pending-payment'

export interface PendingPayment {
  paymentId: string
  transactionCode: string
  createdAt: string
}

function isPendingPayment(value: unknown): value is PendingPayment {
  if (typeof value !== 'object' || value === null) return false
  const pending = value as Record<string, unknown>

  return (
    isValidPaymentId(typeof pending.paymentId === 'string' ? pending.paymentId : null) &&
    typeof pending.transactionCode === 'string' &&
    pending.transactionCode.length > 0 &&
    typeof pending.createdAt === 'string' &&
    !Number.isNaN(new Date(pending.createdAt).getTime())
  )
}

export const pendingPaymentStorage = {
  get(): PendingPayment | null {
    try {
      const serialized = sessionStorage.getItem(PENDING_PAYMENT_STORAGE_KEY)
      if (!serialized) return null

      const parsed: unknown = JSON.parse(serialized)
      if (isPendingPayment(parsed)) return parsed
      sessionStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY)
    } catch {
      // Storage có thể bị chặn; trang kết quả vẫn dùng được với paymentId hợp lệ từ backend.
    }
    return null
  },

  save(payment: PendingPayment): void {
    sessionStorage.setItem(PENDING_PAYMENT_STORAGE_KEY, JSON.stringify(payment))
  },

  clearIfMatches(paymentId: string): void {
    try {
      if (this.get()?.paymentId === paymentId) {
        sessionStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY)
      }
    } catch {
      // Không cần chặn giao diện nếu trình duyệt không cho phép dùng storage.
    }
  },
}
