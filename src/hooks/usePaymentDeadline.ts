import { useEffect, useRef, useState } from 'react'

// One refresh for each payment/deadline, including after tab suspension.
// Countdown is display-only; the API checks the server clock on every action.
export function usePaymentDeadline(paymentId: string | undefined, expiresAt: string | undefined, refresh: () => void) {
  const [now, setNow] = useState(Date.now)
  const refreshed = useRef(new Set<string>())
  const refreshRef = useRef(refresh)
  useEffect(() => { refreshRef.current = refresh }, [refresh])
  useEffect(() => {
    if (!paymentId || !expiresAt) return
    const key = paymentId + ':' + expiresAt
    const tick = () => {
      const current = Date.now()
      setNow(current)
      if (current >= Date.parse(expiresAt) && !refreshed.current.has(key)) {
        refreshed.current.add(key)
        refreshRef.current()
      }
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [paymentId, expiresAt])
  return expiresAt ? Math.max(0, Math.ceil((Date.parse(expiresAt) - now) / 1000)) : 0
}
