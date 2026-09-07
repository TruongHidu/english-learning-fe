import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PaymentDetail } from '../../types/payment.types'
import PaymentHistoryPage from './PaymentHistoryPage'
import { pendingPaymentStorage } from '../../utils/pending-payment'

const mocks = vi.hoisted(() => ({ getHistory: vi.fn(), retryPayment: vi.fn(), cancelPayment: vi.fn(), assign: vi.fn() }))

vi.mock('../../services/payment.service', () => ({
  paymentService: { getHistory: mocks.getHistory, retryPayment: mocks.retryPayment, cancelPayment: mocks.cancelPayment },
}))
vi.mock('../../utils/browser-navigation', () => ({ browserNavigation: { assign: mocks.assign } }))

const transaction: PaymentDetail = {
  paymentId: 'aaaaaaaaaaaaaaaaaaaaaaaa',
  transactionCode: 'PAY001',
  packageName: 'Túi Đá Quý',
  amount: 19000,
  diamondAmount: 120,
  currency: 'VND',
  paymentMethod: 'VNPAY',
  status: 'SUCCESS',
  createdAt: '2026-09-07T05:00:00.000Z',
  paidAt: '2026-09-07T05:02:00.000Z',
  expiresAt: '2026-09-07T05:15:00.000Z',
}

function renderHistory() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter><PaymentHistoryPage /></MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('PaymentHistoryPage', () => {
  beforeEach(() => vi.resetAllMocks())
  afterEach(() => vi.useRealTimers())

  function pendingHistory() {
    const pending = { ...transaction, status: 'PENDING' as const, paidAt: null,
      expiresAt: new Date(Date.now() + 600_000).toISOString() }
    const history = { payments: [pending], total: 1, page: 1, limit: 20, totalPages: 1 }
    mocks.getHistory.mockResolvedValue(history)
    return { pending, history }
  }

  it('pending shows countdown; double-click retry saves before redirect', async () => {
    const { pending } = pendingHistory()
    let complete!: (value: unknown) => void
    mocks.retryPayment.mockReturnValue(new Promise(resolve => { complete = resolve }))
    mocks.assign.mockImplementation(() => {
      expect(pendingPaymentStorage.get()?.paymentId).toBe(pending.paymentId)
    })
    renderHistory()
    const button = await screen.findByRole('button', { name: 'Thanh toán lại PAY001' })
    expect(screen.getByText(/Còn lại: 10:00/)).toBeInTheDocument()
    fireEvent.click(button); fireEvent.click(button)
    expect(mocks.retryPayment).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Hủy giao dịch PAY001' })).toBeDisabled()
    await act(async () => { complete({ ...pending, paymentUrl: 'https://sandbox.vnpayment.vn/test' }) })
    await waitFor(() => expect(mocks.assign).toHaveBeenCalledWith('https://sandbox.vnpayment.vn/test'))
  })

  it.each(['SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'])('terminal %s hides actions', async status => {
    pendingHistory()
    mocks.getHistory.mockResolvedValue({ payments: [{ ...transaction, status }], total: 1, page: 1, totalPages: 1 })
    renderHistory()
    await screen.findByText('PAY001')
    expect(screen.queryByRole('button', { name: /Thanh toán lại/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Hủy giao dịch/ })).not.toBeInTheDocument()
  })

  it.each(['PAYMENT_EXPIRED', 'PAYMENT_NOT_PENDING', 'NETWORK'])('retry error %s refetches without redirect', async code => {
    pendingHistory()
    mocks.retryPayment.mockRejectedValue({ code, message: 'Không thể tiếp tục' })
    renderHistory()
    fireEvent.click(await screen.findByRole('button', { name: 'Thanh toán lại PAY001' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tiếp tục')
    await waitFor(() => expect(mocks.getHistory).toHaveBeenCalledTimes(2))
    expect(mocks.assign).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Thanh toán lại PAY001' })).toBeEnabled())
  })

  it.each([true, false])('cancel confirmation clears only matching storage (%s)', async matches => {
    const { pending, history } = pendingHistory()
    pendingPaymentStorage.save({ paymentId: matches ? pending.paymentId : 'b'.repeat(24),
      transactionCode: 'PAY001', createdAt: pending.createdAt })
    mocks.cancelPayment.mockResolvedValue({ ...pending, status: 'CANCELLED' })
    renderHistory()
    fireEvent.click(await screen.findByRole('button', { name: 'Hủy giao dịch PAY001' }))
    expect(screen.getByRole('dialog', { name: 'Hủy giao dịch?' })).toBeInTheDocument()
    expect(mocks.cancelPayment).not.toHaveBeenCalled()
    mocks.getHistory.mockResolvedValue({ ...history, payments: [{ ...pending, status: 'CANCELLED' }] })
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận hủy' }))
    await waitFor(() => expect(mocks.cancelPayment).toHaveBeenCalledWith(pending.paymentId))
    await screen.findByText('Đã hủy giao dịch')
    expect(pendingPaymentStorage.get()?.paymentId ?? null).toBe(matches ? null : 'b'.repeat(24))
  })

  it('deadline refreshes once, with no per-second API calls', async () => {
    const { pending, history } = pendingHistory()
    renderHistory()
    await screen.findByText('PAY001')
    vi.useFakeTimers()
    // Change deadline after mounting to start a controlled fake-timer interval.
    mocks.getHistory.mockResolvedValue({ ...history, payments: [{ ...pending, expiresAt: new Date(Date.now() + 2000).toISOString() }] })
    fireEvent(window, new Event('pageshow'))
    await act(async () => { await vi.advanceTimersByTimeAsync(0) })
    const before = mocks.getHistory.mock.calls.length
    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(mocks.getHistory).toHaveBeenCalledTimes(before)
    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(mocks.getHistory).toHaveBeenCalledTimes(before + 1)
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000) })
    expect(mocks.getHistory).toHaveBeenCalledTimes(before + 1)
  })

  it('cancel error closes modal, refetches and enables actions', async () => {
    pendingHistory()
    mocks.cancelPayment.mockRejectedValue(new Error('Không thể hủy'))
    renderHistory()
    fireEvent.click(await screen.findByRole('button', { name: 'Hủy giao dịch PAY001' }))
    expect(screen.getByRole('button', { name: 'Quay lại' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Hủy giao dịch PAY001' }))
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận hủy' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể hủy')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Hủy giao dịch PAY001' })).toBeEnabled())
    expect(mocks.getHistory).toHaveBeenCalledTimes(2)
  })

  it('render trạng thái tiếng Việt và phân trang theo API', async () => {
    const user = userEvent.setup()
    mocks.getHistory.mockImplementation((page: number) => Promise.resolve({
      payments: [{
        ...transaction,
        paymentId: page === 1 ? transaction.paymentId : 'bbbbbbbbbbbbbbbbbbbbbbbb',
        transactionCode: page === 1 ? 'PAY001' : 'PAY002',
        status: page === 1 ? 'SUCCESS' : 'CANCELLED',
      }],
      total: 21,
      page,
      limit: 20,
      totalPages: 2,
    }))
    renderHistory()

    expect(await screen.findByText('Túi Đá Quý')).toBeInTheDocument()
    expect(screen.getByText('Thành công')).toBeInTheDocument()
    expect(screen.getByText('VNPAY')).toBeInTheDocument()
    expect(screen.getByText((text) => text.includes('19.000') && text.includes('₫'))).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Trang sau' }))
    await waitFor(() => expect(mocks.getHistory).toHaveBeenLastCalledWith(2, 20, expect.any(AbortSignal)))
    expect(await screen.findByText('Đã hủy')).toBeInTheDocument()
    expect(screen.getByText(/Trang 2 \/ 2/)).toBeInTheDocument()
  })
})
