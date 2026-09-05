import { useEffect, useState, useCallback } from 'react'
import DataTable from '../../components/admin/DataTable'
import PageHeader from '../../components/admin/PageHeader'
import {
  adminDiamondService,
  type AdminDiamondTransactionItem,
} from '../../services/admin-diamond.service'

const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  BUY_HEART: {
    label: 'Mua Tim ❤️',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  ADMIN_ADJUST: {
    label: 'Admin Điều chỉnh ⚙️',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  LESSON_REWARD: {
    label: 'Thưởng Bài Học 🎓',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  TOP_UP: {
    label: 'Nạp Kim Cương 💳',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  REWARD: {
    label: 'Phần Thưởng 🎁',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
}

export default function AdminPaymentListPage() {
  const [typeFilter, setTypeFilter] = useState('')
  const [transactions, setTransactions] = useState<AdminDiamondTransactionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await adminDiamondService.getTransactions({
        type: typeFilter || undefined,
        page,
        limit: 10,
      })
      setTransactions(data.transactions)
      setTotalPages(data.totalPages)
      setTotalCount(data.total)
    } catch (err: any) {
      console.error('Lỗi tải giao dịch kim cương:', err)
      setError(err?.response?.data?.message || 'Không thể tải lịch sử giao dịch kim cương.')
    } finally {
      setLoading(false)
    }
  }, [typeFilter, page])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  return (
    <div className="admin-page">
      <PageHeader
        title="Giao dịch Kim Cương"
        description="Theo dõi toàn bộ biến động kim cương (mua tim, admin điều chỉnh, thưởng bài học, nạp kim cương) trong hệ thống."
      />

      {error ? (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold"
          >
            ×
          </button>
        </div>
      ) : null}

      <div className="admin-filter-bar">
        <select
          className="admin-select"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value)
            setPage(1)
          }}
          aria-label="Lọc loại giao dịch"
        >
          <option value="">Tất cả loại giao dịch</option>
          <option value="BUY_HEART">Mua Tim (BUY_HEART)</option>
          <option value="ADMIN_ADJUST">Admin Điều Chỉnh (ADMIN_ADJUST)</option>
          <option value="LESSON_REWARD">Thưởng Bài Học (LESSON_REWARD)</option>
          <option value="TOP_UP">Nạp Kim Cương (TOP_UP)</option>
          <option value="REWARD">Phần Thưởng (REWARD)</option>
        </select>

        <div className="ml-auto text-xs text-slate-500 font-semibold self-center">
          Tổng cộng: <strong className="text-slate-800">{totalCount}</strong> giao dịch
        </div>
      </div>

      <DataTable
        headers={[
          'Mã GD',
          'Người dùng',
          'Loại giao dịch',
          'Biến động 💎',
          'Số dư (Trước → Sau)',
          'Mô tả / Lý do',
          'Thời gian',
        ]}
        minWidth={950}
        caption="Danh sách giao dịch kim cương"
      >
        {loading ? (
          <tr>
            <td colSpan={7} className="text-center py-6 text-slate-500">
              Đang tải danh sách giao dịch...
            </td>
          </tr>
        ) : transactions.length === 0 ? (
          <tr>
            <td colSpan={7} className="text-center py-6 text-slate-500">
              Chưa có giao dịch kim cương nào phù hợp bộ lọc.
            </td>
          </tr>
        ) : (
          transactions.map((tx) => {
            const typeConfig = TYPE_CONFIG[tx.type] || {
              label: tx.type,
              bg: 'bg-slate-50',
              text: 'text-slate-700',
              border: 'border-slate-200',
            }
            const isPositive = tx.amount > 0

            return (
              <tr key={tx.id}>
                <td className="admin-table__primary font-mono text-xs">
                  {tx.id.substring(tx.id.length - 8).toUpperCase()}
                </td>
                <td>
                  <div>
                    <div className="font-bold text-slate-800 text-xs">{tx.userName || 'Người dùng'}</div>
                    <div className="text-[11px] text-slate-500">{tx.userEmail}</div>
                  </div>
                </td>
                <td>
                  <span
                    className={`inline-block px-2.5 py-0.5 text-[11px] font-extrabold rounded-full border ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}
                  >
                    {typeConfig.label}
                  </span>
                </td>
                <td>
                  <span
                    className={`font-black text-xs px-2 py-1 rounded-lg ${
                      isPositive
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-100'
                        : 'text-rose-700 bg-rose-50 border border-rose-100'
                    }`}
                  >
                    {isPositive ? `+${tx.amount.toLocaleString('vi-VN')}` : tx.amount.toLocaleString('vi-VN')} 💎
                  </span>
                </td>
                <td className="text-xs font-semibold text-slate-600">
                  <span>{(tx.balanceBefore ?? 0).toLocaleString('vi-VN')}</span>
                  <span className="mx-1.5 text-slate-400">→</span>
                  <span className="font-bold text-cyan-700">{(tx.balanceAfter ?? 0).toLocaleString('vi-VN')} 💎</span>
                </td>
                <td className="text-xs text-slate-600 max-w-xs truncate" title={tx.description}>
                  {tx.description || '—'}
                </td>
                <td className="text-xs text-slate-500 whitespace-nowrap">
                  {formatDate(tx.createdAt)}
                </td>
              </tr>
            )
          })
        )}
      </DataTable>

      {/* Pagination controls */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-xs text-slate-500">
            Trang <strong className="text-slate-800">{page}</strong> / {totalPages}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Sau
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
