import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ShopData } from '../../types/shop.types'
import { PENDING_PAYMENT_STORAGE_KEY } from '../../utils/pending-payment'
import ShopPage from './ShopPage'

const mocks = vi.hoisted(() => ({
  getShop: vi.fn(),
  purchaseHeart: vi.fn(),
  checkout: vi.fn(),
  getPendingPayment: vi.fn(),
  assign: vi.fn(),
  updateCachedUser: vi.fn(),
}))

vi.mock('../../services/shop.service', () => ({
  shopService: { getShop: mocks.getShop, purchaseHeart: mocks.purchaseHeart },
}))
vi.mock('../../services/payment.service', () => ({
  paymentService: { checkout: mocks.checkout, getPendingPayment: mocks.getPendingPayment },
}))
vi.mock('../../utils/browser-navigation', () => ({
  browserNavigation: { assign: mocks.assign },
}))
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      stats: { diamond: 100, currentHeart: 4, maxHeart: 5 },
    },
    updateCachedUser: mocks.updateCachedUser,
  }),
}))

const shopFixture: ShopData = {
  user: { diamond: 100, currentHeart: 4, maxHeart: 5, nextHeartAt: null },
  items: [],
  diamondPackages: [
    {
      id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
      name: 'Rương Đá Quý',
      diamondAmount: 200,
      bonusDiamond: 50,
      totalDiamond: 250,
      price: 39000,
      currency: 'VND',
      description: 'Gói lớn',
      orderIndex: 2,
    },
    {
      id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
      name: 'Túi Đá Quý',
      diamondAmount: 100,
      bonusDiamond: 20,
      totalDiamond: 120,
      price: 19000,
      currency: 'VND',
      description: 'Gói khởi đầu',
      orderIndex: 1,
    },
  ],
}

function renderShop(): ReactElement {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })
  const view = (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter><Routes>
        <Route path="/" element={<ShopPage />} />
        <Route path="/payments/history" element={<h1>Lịch sử thanh toán</h1>} />
      </Routes></MemoryRouter>
    </QueryClientProvider>
  )
  render(view)
  return view
}

describe('ShopPage - thanh toán kim cương', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getShop.mockResolvedValue(shopFixture)
    mocks.getPendingPayment.mockResolvedValue(null)
  })

  it('render gói theo orderIndex và định dạng giá VND', async () => {
    renderShop()

    expect(await screen.findByText('Túi Đá Quý')).toBeInTheDocument()
    const packageNames = screen.getAllByTitle(/Đá Quý/)
    expect(packageNames.map((item) => item.textContent)).toEqual(['Túi Đá Quý', 'Rương Đá Quý'])
    expect(screen.getByText((text) => text.includes('19.000') && text.includes('₫'))).toBeInTheDocument()
    expect(screen.getByText('+20 💎 thưởng')).toBeInTheDocument()
  })

  it('pending from backend blocks checkout even without sessionStorage', async () => {
    mocks.getPendingPayment.mockResolvedValue({ paymentId: 'a'.repeat(24), transactionCode: 'PAY-PENDING',
      status: 'PENDING', expiresAt: new Date(Date.now() + 600_000).toISOString() })
    renderShop()
    await screen.findByText('Mã PAY-PENDING')
    for (const button of screen.getAllByRole('button', { name: 'MUA NGAY' })) expect(button).toBeDisabled()
    expect(mocks.checkout).not.toHaveBeenCalled()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'THANH TOÁN HOẶC HỦY' }))
    expect(screen.getByRole('heading', { name: 'Lịch sử thanh toán' })).toBeInTheDocument()
  })

  it('checkout conflict refreshes pending and navigates to history', async () => {
    mocks.checkout.mockRejectedValue({ code: 'PAYMENT_PENDING_EXISTS', message: 'Bạn đang có giao dịch chưa hoàn thành' })
    renderShop()
    const user = userEvent.setup()
    await screen.findByText('Túi Đá Quý')
    await user.click(screen.getAllByRole('button', { name: 'MUA NGAY' })[0])
    await user.click(screen.getByRole('button', { name: 'TIẾP TỤC VỚI VNPAY' }))
    expect(await screen.findByRole('heading', { name: 'Lịch sử thanh toán' })).toBeInTheDocument()
    expect(mocks.assign).not.toHaveBeenCalled()
    expect(mocks.getPendingPayment.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it('chặn double click, lưu paymentId trước khi redirect', async () => {
    const user = userEvent.setup()
    const events: string[] = []
    let resolveCheckout: ((value: unknown) => void) | undefined
    mocks.checkout.mockReturnValue(new Promise((resolve) => { resolveCheckout = resolve }))
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      events.push('storage')
    })
    mocks.assign.mockImplementation(() => { events.push('redirect') })
    renderShop()

    await screen.findByText('Túi Đá Quý')
    await user.click(screen.getAllByRole('button', { name: 'MUA NGAY' })[0])
    const confirmButton = screen.getByRole('button', { name: 'TIẾP TỤC VỚI VNPAY' })
    await user.dblClick(confirmButton)
    expect(mocks.checkout).toHaveBeenCalledTimes(1)
    expect(mocks.checkout).toHaveBeenCalledWith('aaaaaaaaaaaaaaaaaaaaaaaa')

    await act(async () => {
      resolveCheckout?.({
        paymentId: 'cccccccccccccccccccccccc',
        transactionCode: 'PAY001',
        status: 'PENDING',
        paymentUrl: 'https://sandbox.vnpayment.vn/payment',
        expiresAt: '2026-09-07T05:15:00.000Z',
      })
    })

    expect(storageSpy).toHaveBeenCalledWith(
      PENDING_PAYMENT_STORAGE_KEY,
      expect.stringContaining('cccccccccccccccccccccccc'),
    )
    const serializedPendingPayment = storageSpy.mock.calls[0][1]
    expect(serializedPendingPayment).toContain('PAY001')
    expect(serializedPendingPayment).not.toContain('sandbox.vnpayment.vn')
    expect(events).toEqual(['storage', 'redirect'])
    storageSpy.mockRestore()
  })

  it('giữ người dùng ở shop và mở lại nút khi checkout lỗi', async () => {
    const user = userEvent.setup()
    mocks.checkout.mockRejectedValue(new Error('Mất kết nối'))
    renderShop()

    await screen.findByText('Túi Đá Quý')
    await user.click(screen.getAllByRole('button', { name: 'MUA NGAY' })[0])
    await user.click(screen.getByRole('button', { name: 'TIẾP TỤC VỚI VNPAY' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Mất kết nối')
    expect(mocks.assign).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.getByRole('button', { name: 'TIẾP TỤC VỚI VNPAY' })).toBeEnabled())
  })
})
