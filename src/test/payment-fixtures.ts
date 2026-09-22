import type { PaymentDetail, SepayCheckoutData } from '../types/payment.types'

export function sepayFixture(): SepayCheckoutData {
  return { paymentId: 'a'.repeat(24), transactionCode: 'EL0123456789ABCDEF', paymentMethod: 'SEPAY',
    status: 'PENDING', amount: 19000, currency: 'VND', qrUrl: 'https://vietqr.app/img?test=1',
    bankCode: 'Vietcombank', accountNumber: '0123456789', accountName: 'NGUYEN VAN A',
    transferContent: 'EL0123456789ABCDEF', expiresAt: new Date(Date.now() + 600000).toISOString() }
}
export function sepayDetail(): PaymentDetail {
  return { ...sepayFixture(), packageName: 'Gói thử', diamondAmount: 120, createdAt: new Date().toISOString(), paidAt: null }
}
