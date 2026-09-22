import { describe, expect, it } from 'vitest'
import { isSepayCheckout, isVnpayCheckout } from './checkout-validation'
import { sepayFixture } from '../test/payment-fixtures'

describe('checkout validation', () => {
  it('keeps provider types separate', () => {
    const sepay = sepayFixture()
    expect(isSepayCheckout(sepay)).toBe(true)
    expect(isVnpayCheckout(sepay)).toBe(false)
    expect(isVnpayCheckout({ paymentId: 'id', transactionCode: 'PAY1', status: 'PENDING', expiresAt: sepay.expiresAt,
      paymentUrl: 'https://sandbox.vnpayment.vn/test' })).toBe(true)
  })
  it.each([{ qrUrl: 'http://vietqr.app' }, { qrUrl: 'javascript:alert(1)' }, { qrUrl: 'bad' },
    { amount: 0 }, { amount: 1.5 }, { paymentId: '' }, { transactionCode: '' }, { expiresAt: 'bad' },
    { accountNumber: '' }, { currency: 'USD' }, { status: 'UNKNOWN' }])('rejects malformed SePay %j', patch => {
    expect(isSepayCheckout({ ...sepayFixture(), ...patch })).toBe(false)
  })
  it.each(['', 'http://bank.test', 'javascript:alert(1)', 'https://user:pass@bank.test'])('rejects unsafe redirect %s', paymentUrl => {
    expect(isVnpayCheckout({ ...sepayFixture(), paymentMethod: 'VNPAY', paymentUrl })).toBe(false)
  })
})
