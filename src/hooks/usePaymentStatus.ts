import { useCallback, useEffect, useState } from 'react'
import { paymentService } from '../services/payment.service'
import type { PaymentDetail } from '../types/payment.types'
import { getPaymentErrorMessage, isPaymentNotFoundError } from '../utils/payment-errors'

interface PaymentStatusState {
  payment: PaymentDetail | null
  isLoading: boolean
  isNotFound: boolean
  error: string
}

export function usePaymentStatus(paymentId: string | null) {
  const [retryKey, setRetryKey] = useState(0)
  const [state, setState] = useState<PaymentStatusState>({
    payment: null, isLoading: Boolean(paymentId), isNotFound: false, error: '',
  })

  useEffect(() => {
    const controller = new AbortController()
    setState({ payment: null, isLoading: Boolean(paymentId), isNotFound: false, error: '' })
    if (!paymentId) return

    void paymentService.getPayment(paymentId, controller.signal).then((payment) => {
      if (!controller.signal.aborted) {
        setState({ payment, isLoading: false, isNotFound: false, error: '' })
      }
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        setState({ payment: null, isLoading: false,
          isNotFound: isPaymentNotFoundError(error), error: getPaymentErrorMessage(error) })
      }
    })

    return () => controller.abort()
  }, [paymentId, retryKey])

  const retry = useCallback(() => setRetryKey((current) => current + 1), [])
  return { ...state, retry }
}
