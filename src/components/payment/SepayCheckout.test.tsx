import { act, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SepayCheckout from './SepayCheckout'
import { sepayDetail, sepayFixture } from '../../test/payment-fixtures'
import { formatVnd } from '../../utils/payment'

const mocks = vi.hoisted(() => ({ getPayment: vi.fn(), cancelPayment: vi.fn(), getShop: vi.fn(), update: vi.fn() }))
vi.mock('../../services/payment.service', () => ({ paymentService: mocks }))
vi.mock('../../services/shop.service', () => ({ shopService: mocks }))
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ updateCachedUser: mocks.update }) }))

async function mount() {
  const checkout = sepayFixture()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
  const close = vi.fn()
  const view = render(<QueryClientProvider client={client}><SepayCheckout checkout={checkout} onClose={close} /></QueryClientProvider>)
  await act(async () => {})
  return { ...view, checkout, client, close }
}
const advance = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms) }) }

describe('SePay checkout', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.useFakeTimers()
    mocks.getPayment.mockResolvedValue(sepayDetail())
    mocks.getShop.mockResolvedValue({ user: { diamond: 220, currentHeart: 5, maxHeart: 5, nextHeartAt: null } })
  })
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  it('renders server QR and bank data, VND, countdown, clipboard feedback and image error', async () => {
    const copy = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: copy } })
    const { checkout } = await mount()
    const qr = screen.getByRole('img')
    expect(qr).toHaveAttribute('src', checkout.qrUrl)
    for (const value of [checkout.bankCode, checkout.accountName, checkout.accountNumber, checkout.transferContent]) expect(screen.getByText(value)).toBeInTheDocument()
    expect(screen.getByText(text => text.replace(/\s/g, '') === formatVnd(19000).replace(/\s/g, ''))).toBeInTheDocument()
    expect(screen.getByText('10:00')).toBeInTheDocument()
    await advance(1000)
    expect(screen.getByText('09:59')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Sao chép số tài khoản' }))
    await act(async () => {})
    expect(copy).toHaveBeenLastCalledWith(checkout.accountNumber)
    fireEvent.click(screen.getByRole('button', { name: 'Sao chép nội dung chuyển khoản' }))
    await act(async () => {})
    expect(copy).toHaveBeenLastCalledWith(checkout.transferContent)
    expect(screen.getByText('Đã sao chép')).toBeInTheDocument()
    copy.mockRejectedValue(new Error('denied'))
    fireEvent.click(screen.getByRole('button', { name: 'Sao chép số tiền' }))
    await act(async () => {})
    expect(screen.getByText(/Không thể sao chép/)).toBeInTheDocument()
    fireEvent.error(qr)
    expect(screen.getByRole('alert')).toHaveTextContent('Không tải được QR')
  })

  it('polls every 3 seconds; manual confirmation only refetches; success refreshes balance and stops timers', async () => {
    const { client } = await mount()
    expect(mocks.getPayment).toHaveBeenCalledTimes(1)
    await advance(2999)
    expect(mocks.getPayment).toHaveBeenCalledTimes(1)
    await advance(1)
    expect(mocks.getPayment).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByRole('button', { name: 'Tôi đã chuyển khoản' }))
    await act(async () => {})
    expect(mocks.getPayment).toHaveBeenCalledTimes(3)
    expect(screen.getByText('Đang chờ thanh toán')).toBeInTheDocument()
    mocks.getPayment.mockResolvedValue({ ...sepayDetail(), status: 'SUCCESS' })
    await advance(3000)
    expect(screen.getByText('Thành công')).toBeInTheDocument()
    expect(mocks.update).toHaveBeenCalledWith({ stats: expect.objectContaining({ diamond: 220 }) })
    expect(client.getQueryData(['shop'])).toEqual(expect.objectContaining({ user: expect.objectContaining({ diamond: 220 }) }))
    await advance(60000)
    expect(mocks.getPayment).toHaveBeenCalledTimes(4)
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each([['FAILED', 'Thất bại'], ['CANCELLED', 'Đã hủy'], ['EXPIRED', 'Hết hạn']])('stops on %s', async (status, label) => {
    mocks.getPayment.mockResolvedValue({ ...sepayDetail(), status })
    await mount()
    expect(screen.getByText(label)).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    await advance(30000)
    expect(mocks.getPayment).toHaveBeenCalledTimes(1)
  })

  it('aborts in-flight detail and clears timers on unmount without overlapping requests', async () => {
    mocks.getPayment.mockReturnValue(new Promise(() => {}))
    const { unmount } = await mount()
    const signal = mocks.getPayment.mock.calls[0][1] as AbortSignal
    await advance(20000)
    expect(mocks.getPayment).toHaveBeenCalledTimes(1)
    unmount()
    expect(signal.aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('checks server at deadline without inventing EXPIRED', async () => {
    await mount()
    vi.setSystemTime(Date.now() + 600000)
    await advance(1000)
    expect(mocks.getPayment).toHaveBeenCalledTimes(2)
    expect(screen.getByText('Đang chờ thanh toán')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('backs off on network errors, pauses hidden tabs and refetches on visibility', async () => {
    mocks.getPayment.mockRejectedValueOnce({ isNetworkError: true })
    await mount()
    await advance(5999)
    expect(mocks.getPayment).toHaveBeenCalledTimes(1)
    await advance(1)
    expect(mocks.getPayment).toHaveBeenCalledTimes(2)
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    fireEvent(document, new Event('visibilitychange'))
    await advance(30000)
    expect(mocks.getPayment).toHaveBeenCalledTimes(2)
    hidden.mockReturnValue(false)
    fireEvent(document, new Event('visibilitychange'))
    await act(async () => {})
    expect(mocks.getPayment).toHaveBeenCalledTimes(3)
  })

  it('stops on payment not found', async () => {
    mocks.getPayment.mockRejectedValue({ status: 404, code: 'PAYMENT_NOT_FOUND' })
    await mount()
    expect(screen.getByRole('alert')).toHaveTextContent('Không tìm thấy giao dịch')
    await advance(60000)
    expect(mocks.getPayment).toHaveBeenCalledTimes(1)
  })

  it('requires confirmation to cancel and verifies actual detail afterwards', async () => {
    await mount()
    fireEvent.click(screen.getByRole('button', { name: 'Hủy giao dịch' }))
    expect(mocks.cancelPayment).not.toHaveBeenCalled()
    mocks.cancelPayment.mockResolvedValue({ ...sepayDetail(), status: 'CANCELLED' })
    mocks.getPayment.mockResolvedValue({ ...sepayDetail(), status: 'CANCELLED' })
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận hủy' }))
    await act(async () => {})
    expect(mocks.cancelPayment).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Đã hủy')).toBeInTheDocument()
  })
})
