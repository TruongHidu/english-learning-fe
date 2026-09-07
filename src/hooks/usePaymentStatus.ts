import { useCallback, useEffect, useState } from 'react'
import { paymentService } from '../services/payment.service'
import type { PaymentDetail } from '../types/payment.types'
import { getPaymentErrorMessage, isPaymentNotFoundError } from '../utils/payment-errors'
import { isTerminalPaymentStatus } from '../utils/payment'

export const PAYMENT_POLL_INTERVAL_MS = 2_000
export const PAYMENT_POLL_MAX_ATTEMPTS = 15
export const PAYMENT_POLL_TIMEOUT_MS = 30_000

interface PaymentStatusState {
  payment: PaymentDetail | null
  isLoading: boolean
  isChecking: boolean
  isTimedOut: boolean
  isNotFound: boolean
  error: string
}

const initialState: PaymentStatusState = {
  payment: null,
  isLoading: true,
  isChecking: true,
  isTimedOut: false,
  isNotFound: false,
  error: '',
}

export function usePaymentStatus(paymentId: string | null) {
  const [retryKey, setRetryKey] = useState(0)
  const [state, setState] = useState<PaymentStatusState>(() => ({
    ...initialState,
    isLoading: Boolean(paymentId),
    isChecking: Boolean(paymentId),
  }))

  useEffect(() => {
    if (!paymentId) {
      setState({
        ...initialState,
        isLoading: false,
        isChecking: false,
      })
      return
    }
    const activePaymentId = paymentId

    let active = true
    let attempt = 0
    let pollTimer: number | undefined
    let requestController: AbortController | undefined

    setState({
      ...initialState,
      isLoading: true,
      isChecking: true,
    })

    const stop = () => {
      if (pollTimer !== undefined) window.clearTimeout(pollTimer)
      window.clearTimeout(deadlineTimer)
    }

    const handleDeadline = () => {
      if (!active) return
      active = false
      if (pollTimer !== undefined) window.clearTimeout(pollTimer)
      requestController?.abort()
      setState((current) => ({
        ...current,
        isLoading: false,
        isChecking: false,
        isTimedOut: current.payment?.status === 'PENDING',
      }))
    }

    const deadlineTimer = window.setTimeout(handleDeadline, PAYMENT_POLL_TIMEOUT_MS)

    const scheduleNextCheck = () => {
      if (!active) return
      if (attempt >= PAYMENT_POLL_MAX_ATTEMPTS) {
        stop()
        setState((current) => ({
          ...current,
          isLoading: false,
          isChecking: false,
          isTimedOut: current.payment?.status === 'PENDING',
        }))
        return
      }
      pollTimer = window.setTimeout(checkStatus, PAYMENT_POLL_INTERVAL_MS)
    }

    async function checkStatus() {
      if (!active) return
      attempt += 1
      requestController = new AbortController()

      try {
        const payment = await paymentService.getPayment(activePaymentId, requestController.signal)
        if (!active) return

        const isTerminal = isTerminalPaymentStatus(payment.status)
        setState({
          payment,
          isLoading: false,
          isChecking: !isTerminal,
          isTimedOut: false,
          isNotFound: false,
          error: '',
        })

        if (isTerminal) {
          stop()
          return
        }
        scheduleNextCheck()
      } catch (requestError) {
        if (!active || requestController.signal.aborted) return

        if (isPaymentNotFoundError(requestError)) {
          stop()
          setState({
            payment: null,
            isLoading: false,
            isChecking: false,
            isTimedOut: false,
            isNotFound: true,
            error: getPaymentErrorMessage(requestError),
          })
          return
        }

        setState((current) => ({
          ...current,
          isLoading: false,
          isChecking: true,
          error: `${getPaymentErrorMessage(requestError)} Hệ thống sẽ tự kiểm tra lại.`,
        }))
        scheduleNextCheck()
      }
    }

    void checkStatus()

    return () => {
      active = false
      stop()
      requestController?.abort()
    }
  }, [paymentId, retryKey])

  const retry = useCallback(() => setRetryKey((current) => current + 1), [])

  return { ...state, retry }
}
