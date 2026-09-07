import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PaymentDetail } from '../../types/payment.types'
import PaymentHistoryPage from './PaymentHistoryPage'

const mocks = vi.hoisted(() => ({ getHistory: vi.fn() }))

vi.mock('../../services/payment.service', () => ({
  paymentService: { getHistory: mocks.getHistory },
}))

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
  beforeEach(() => vi.clearAllMocks())

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
