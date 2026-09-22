import type { CheckoutResponse, SepayCheckoutData } from '../types/payment.types'

const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
export function isHttpsUrl(value: unknown): value is string {
  if (!text(value)) return false
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password } catch { return false }
}
function base(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string, unknown>
  return text(data.paymentId) && text(data.transactionCode) && text(data.expiresAt) &&
    Number.isFinite(Date.parse(data.expiresAt)) &&
    ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(String(data.status))
}
export function isVnpayCheckout(value: unknown): value is CheckoutResponse {
  return base(value) && value.paymentMethod !== 'SEPAY' && isHttpsUrl(value.paymentUrl)
}
export function isSepayCheckout(value: unknown): value is SepayCheckoutData {
  return base(value) && value.paymentMethod === 'SEPAY' && isHttpsUrl(value.qrUrl) &&
    Number.isSafeInteger(value.amount) && Number(value.amount) > 0 && value.currency === 'VND' &&
    ['bankCode', 'accountNumber', 'accountName', 'transferContent'].every(key => text(value[key]))
}
