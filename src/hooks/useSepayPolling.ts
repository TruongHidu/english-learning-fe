import { useEffect, useRef, useState } from 'react'
import { paymentService } from '../services/payment.service'
import type { PaymentDetail } from '../types/payment.types'
import { getPaymentErrorMessage } from '../utils/payment-errors'

export function useSepayPolling(paymentId: string) {
  const [payment, setPayment] = useState<PaymentDetail | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [halted, setHalted] = useState(false)
  const refreshRef = useRef<() => void>(() => {})
  useEffect(() => {
    setPayment(null)
    setHalted(false)
    setError('')
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    let inFlight = false
    let stopped = false
    let failures = 0
    async function poll() {
      if (controller.signal.aborted || stopped || inFlight) return
      clearTimeout(timer)
      inFlight = true
      setBusy(true)
      try {
        const next = await paymentService.getPayment(paymentId, controller.signal)
        if (controller.signal.aborted) return
        if (!next || next.paymentId !== paymentId || next.paymentMethod !== 'SEPAY' ||
          !Number.isFinite(Date.parse(next.expiresAt)) ||
          !['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(next.status)) {
          stopped = true
          throw new Error('Dữ liệu giao dịch không hợp lệ. Vui lòng mở lại lịch sử thanh toán.')
        }
        setPayment(next)
        setError('')
        failures = 0
        stopped = next.status !== 'PENDING'
      } catch (cause) {
        if (controller.signal.aborted) return
        const apiError = cause as { status?: number; code?: string }
        stopped ||= apiError.status === 404 || apiError.status === 401 ||
          ['PAYMENT_NOT_FOUND', 'INVALID_TOKEN', 'UNAUTHORIZED', 'ACCOUNT_NOT_ACTIVE'].includes(apiError.code ?? '')
        failures++
        setHalted(stopped)
        setError(getPaymentErrorMessage(cause))
      } finally {
        inFlight = false
        if (!controller.signal.aborted) {
          setBusy(false)
          if (!stopped && !document.hidden) timer = setTimeout(() => void poll(), Math.min(3000 * 2 ** failures, 30000))
        }
      }
    }
    const visibility = () => {
      clearTimeout(timer)
      if (!document.hidden) void poll()
    }
    refreshRef.current = () => { void poll() }
    void poll()
    document.addEventListener('visibilitychange', visibility)
    return () => {
      controller.abort()
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', visibility)
      refreshRef.current = () => {}
    }
  }, [paymentId])
  return { payment, error, busy, halted, refresh: () => refreshRef.current() }
}
