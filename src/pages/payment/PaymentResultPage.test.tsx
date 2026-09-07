import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/api-error'
import type { PaymentDetail } from '../../types/payment.types'
import { PENDING_PAYMENT_STORAGE_KEY } from '../../utils/pending-payment'
import PaymentResultPage from './PaymentResultPage'

const mocks = vi.hoisted(() => ({
  getPayment: vi.fn(),
  getShop: vi.fn(),
  updateCachedUser: vi.fn(),
}))

vi.mock('../../services/payment.service', () => ({
  paymentService: { getPayment: mocks.getPayment },
}))
vi.mock('../../services/shop.service', () => ({
  shopService: { getShop: mocks.getShop },
}))
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ updateCachedUser: mocks.updateCachedUser }),
}))

const pendingPayment: PaymentDetail = {
  paymentId: 'aaaaaaaaaaaaaaaaaaaaaaaa',
  transactionCode: 'PAY001',
  packageName: 'Túi Đá Quý',
  amount: 19000,
  diamondAmount: 120,
  currency: 'VND',
  paymentMethod: 'VNPAY',
  status: 'PENDING',
  createdAt: '2026-09-07T05:00:00.000Z',
  paidAt: null,
  expiresAt: '2026-09-07T05:15:00.000Z',
}

function renderResult(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/payment/result" element={<PaymentResultPage />} />
        <Route path="/payments/:paymentId" element={<PaymentResultPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

async function flushEffects() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('PaymentResultPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.getShop.mockResolvedValue({
      user: { diamond: 220, currentHeart: 5, maxHeart: 5, nextHeartAt: null },
      items: [],
      diamondPackages: [],
    })
  })

  afterEach(() => vi.useRealTimers())

  it('không tin Return URL để tự đánh dấu SUCCESS', async () => {
    mocks.getPayment.mockResolvedValue(pendingPayment)
    renderResult('/payment/result?signatureValid=true&paymentId=aaaaaaaaaaaaaaaaaaaaaaaa&transactionCode=PAY001&status=SUCCESS&vnp_ResponseCode=00')
    await flushEffects()

    expect(screen.getByRole('heading', { name: 'Giao dịch chưa được xác nhận' })).toBeInTheDocument()
    expect(screen.queryByText('Thanh toán thành công')).not.toBeInTheDocument()
  })

  it('retry thủ công PENDING thành SUCCESS và refresh số dư đúng một lần', async () => {
    vi.useFakeTimers()
    mocks.getPayment
      .mockResolvedValueOnce(pendingPayment)
      .mockResolvedValueOnce({
        ...pendingPayment,
        status: 'SUCCESS',
        paidAt: '2026-09-07T05:02:00.000Z',
      })
    renderResult('/payment/result?signatureValid=true&paymentId=aaaaaaaaaaaaaaaaaaaaaaaa&transactionCode=PAY001')
    await flushEffects()
    expect(screen.getByText('Giao dịch chưa được xác nhận')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra lại' }))
    await flushEffects()

    expect(screen.getByRole('heading', { name: 'Thanh toán thành công' })).toBeInTheDocument()
    expect(mocks.getPayment).toHaveBeenCalledTimes(2)
    expect(mocks.getShop).toHaveBeenCalledTimes(1)
    expect(mocks.updateCachedUser).toHaveBeenCalledTimes(1)
    expect(screen.getByText('220 💎')).toBeInTheDocument()

    await act(async () => { vi.advanceTimersByTime(10_000) })
    expect(mocks.getPayment).toHaveBeenCalledTimes(2)
  })

  it('dừng timer và hủy request khi unmount', async () => {
    vi.useFakeTimers()
    mocks.getPayment.mockResolvedValue(pendingPayment)
    const view = renderResult('/payment/result?signatureValid=true&paymentId=aaaaaaaaaaaaaaaaaaaaaaaa')
    await flushEffects()
    const signal = mocks.getPayment.mock.calls[0][1] as AbortSignal

    view.unmount()
    expect(signal.aborted).toBe(true)
    await act(async () => { vi.advanceTimersByTime(10_000) })
    expect(mocks.getPayment).toHaveBeenCalledTimes(1)
  })

  it('không tự poll sau 30 giây và giữ PENDING để retry thủ công', async () => {
    vi.useFakeTimers()
    mocks.getPayment.mockResolvedValue(pendingPayment)
    renderResult('/payment/result?signatureValid=true&paymentId=aaaaaaaaaaaaaaaaaaaaaaaa')
    await flushEffects()

    await act(async () => {
      vi.advanceTimersByTime(30_000)
      await Promise.resolve()
    })

    expect(screen.getByRole('heading', { name: 'Giao dịch chưa được xác nhận' })).toBeInTheDocument()
    expect(mocks.getPayment).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
    expect(screen.getByRole('button', { name: 'Kiểm tra lại' })).toBeEnabled()
  })

  it.each([
    ['SUCCESS', 'Thanh toán thành công'],
    ['FAILED', 'Thanh toán thất bại'],
    ['CANCELLED', 'Bạn đã hủy giao dịch'],
    ['EXPIRED', 'Giao dịch đã hết hạn'],
  ] as const)('hiển thị ngay %s từ backend', async (status, title) => {
    mocks.getPayment.mockResolvedValue({ ...pendingPayment, status })
    renderResult('/payment/result?signatureValid=true&returnResult=processed&paymentId=aaaaaaaaaaaaaaaaaaaaaaaa')
    await flushEffects()
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    expect(mocks.getPayment).toHaveBeenCalledTimes(1)
    expect(mocks.getShop).toHaveBeenCalledTimes(status === 'SUCCESS' ? 1 : 0)
    expect(mocks.updateCachedUser).toHaveBeenCalledTimes(status === 'SUCCESS' ? 1 : 0)
  })

  it('thiếu paymentId không gọi API', async () => {
    renderResult('/payment/result')
    await flushEffects()
    expect(screen.getByRole('heading', { name: 'Không tìm thấy giao dịch' })).toBeInTheDocument()
    expect(mocks.getPayment).not.toHaveBeenCalled()
  })

  it('network error hiển thị lỗi và cho retry thủ công', async () => {
    mocks.getPayment.mockRejectedValueOnce(new Error('Mất kết nối'))
      .mockResolvedValueOnce({ ...pendingPayment, status: 'SUCCESS' })
    renderResult('/payments/aaaaaaaaaaaaaaaaaaaaaaaa')
    await flushEffects()
    expect(screen.getByRole('alert')).toHaveTextContent('Mất kết nối')
    expect(mocks.getShop).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra lại' }))
    await flushEffects()
    expect(screen.getByRole('heading', { name: 'Thanh toán thành công' })).toBeInTheDocument()
  })

  it.each([
    ['invalid', 'Dữ liệu chuyển hướng từ VNPay không hợp lệ'],
    ['not_found', 'Không tìm thấy giao dịch từ lần chuyển hướng này'],
    ['error', 'Chưa thể ghi nhận kết quả thanh toán'],
  ])('hiển thị lỗi return %s an toàn', async (result, message) => {
    renderResult('/payment/result?returnResult=' + result)
    await flushEffects()
    expect(screen.getByRole('alert')).toHaveTextContent(message)
    expect(mocks.getShop).not.toHaveBeenCalled()
  })

  it('chỉ xóa payment đang lưu khi trạng thái terminal', async () => {
    sessionStorage.setItem(PENDING_PAYMENT_STORAGE_KEY, JSON.stringify({
      paymentId: pendingPayment.paymentId, transactionCode: pendingPayment.transactionCode,
      createdAt: pendingPayment.createdAt,
    }))
    mocks.getPayment.mockResolvedValueOnce(pendingPayment)
      .mockResolvedValueOnce({ ...pendingPayment, status: 'CANCELLED' })
    renderResult('/payment/result')
    await flushEffects()
    expect(sessionStorage.getItem(PENDING_PAYMENT_STORAGE_KEY)).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra lại' }))
    await flushEffects()
    expect(sessionStorage.getItem(PENDING_PAYMENT_STORAGE_KEY)).toBeNull()
  })

  it('FAILED không refresh hoặc thay đổi số dư', async () => {
    mocks.getPayment.mockResolvedValue({ ...pendingPayment, status: 'FAILED' })
    renderResult('/payments/aaaaaaaaaaaaaaaaaaaaaaaa')
    await flushEffects()

    expect(screen.getByRole('heading', { name: 'Thanh toán thất bại' })).toBeInTheDocument()
    expect(mocks.getShop).not.toHaveBeenCalled()
    expect(mocks.updateCachedUser).not.toHaveBeenCalled()
  })

  it('signatureValid=false cảnh báo và chỉ kiểm tra paymentId trong sessionStorage', async () => {
    sessionStorage.setItem(PENDING_PAYMENT_STORAGE_KEY, JSON.stringify({
      paymentId: 'bbbbbbbbbbbbbbbbbbbbbbbb',
      transactionCode: 'PAY-SESSION',
      createdAt: '2026-09-07T05:00:00.000Z',
    }))
    mocks.getPayment.mockResolvedValue({
      ...pendingPayment,
      paymentId: 'bbbbbbbbbbbbbbbbbbbbbbbb',
      transactionCode: 'PAY-SESSION',
      status: 'CANCELLED',
    })
    renderResult('/payment/result?signatureValid=false&paymentId=cccccccccccccccccccccccc&transactionCode=FAKE')
    await flushEffects()

    expect(screen.getByRole('alert')).toHaveTextContent('Dữ liệu chuyển hướng từ VNPay không hợp lệ')
    expect(mocks.getPayment).toHaveBeenCalledWith('bbbbbbbbbbbbbbbbbbbbbbbb', expect.any(AbortSignal))
    expect(screen.getByRole('heading', { name: 'Bạn đã hủy giao dịch' })).toBeInTheDocument()
  })

  it('fallback sang sessionStorage khi URL thiếu paymentId', async () => {
    sessionStorage.setItem(PENDING_PAYMENT_STORAGE_KEY, JSON.stringify({
      paymentId: 'dddddddddddddddddddddddd',
      transactionCode: 'PAY-STORED',
      createdAt: '2026-09-07T05:00:00.000Z',
    }))
    mocks.getPayment.mockResolvedValue({
      ...pendingPayment,
      paymentId: 'dddddddddddddddddddddddd',
      transactionCode: 'PAY-STORED',
      status: 'EXPIRED',
    })
    renderResult('/payment/result?signatureValid=true&transactionCode=PAY-STORED')
    await flushEffects()

    expect(mocks.getPayment).toHaveBeenCalledWith('dddddddddddddddddddddddd', expect.any(AbortSignal))
    expect(screen.getByRole('heading', { name: 'Giao dịch đã hết hạn' })).toBeInTheDocument()
  })

  it('hiển thị an toàn khi payment không tồn tại hoặc thuộc user khác', async () => {
    mocks.getPayment.mockRejectedValue(new ApiError({
      status: 404,
      code: 'PAYMENT_NOT_FOUND',
      message: 'Không tìm thấy thanh toán',
    }))
    renderResult('/payments/aaaaaaaaaaaaaaaaaaaaaaaa')
    await flushEffects()

    expect(screen.getByRole('heading', { name: 'Không tìm thấy giao dịch' })).toBeInTheDocument()
    expect(screen.getByText(/không thuộc tài khoản/)).toBeInTheDocument()
  })
})
