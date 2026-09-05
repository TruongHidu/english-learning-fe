import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import DataTable from '../../components/admin/DataTable'
import PageHeader from '../../components/admin/PageHeader'
import SearchInput from '../../components/admin/SearchInput'
import StatusBadge from '../../components/admin/StatusBadge'
import AdjustDiamondModal from '../../components/admin/AdjustDiamondModal'
import {
  adminDiamondService,
  type AdminUserItem,
} from '../../services/admin-diamond.service'

export default function AdminUserListPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  // Modal adjust diamond
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null)
  const [isAdjusting, setIsAdjusting] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await adminDiamondService.getUsers({
        q: search || undefined,
        status: status || undefined,
        page,
        limit: 10,
      })
      setUsers(data.users)
      setTotalPages(data.totalPages)
      setTotalUsers(data.total)
    } catch (err: any) {
      console.error('Lỗi tải danh sách người dùng:', err)
      setError(err?.response?.data?.message || 'Không thể tải danh sách người dùng từ hệ thống.')
    } finally {
      setLoading(false)
    }
  }, [search, status, page])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleAdjustDiamonds = async (amount: number, reason: string) => {
    if (!selectedUser) return
    try {
      setIsAdjusting(true)
      const res = await adminDiamondService.adjustDiamonds(selectedUser.id, {
        amount,
        reason,
      })
      setSuccessMessage(
        `Đã điều chỉnh thành công ${amount > 0 ? `+${amount}` : amount} 💎 cho tài khoản ${selectedUser.email}. Số dư mới: ${res.user.diamond} 💎`
      )

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bc = new BroadcastChannel('lingofox_realtime')
          bc.postMessage({
            type: 'DIAMOND_UPDATED',
            userId: selectedUser.id,
            diamond: res.user.diamond,
            change: amount,
            reason,
          })
          bc.close()
        } catch {
          // ignore
        }
      }
      setSelectedUser(null)
      // Refresh current user in list
      fetchUsers()
      setTimeout(() => setSuccessMessage(null), 6000)
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể điều chỉnh kim cương. Vui lòng thử lại.')
    } finally {
      setIsAdjusting(false)
    }
  }

  return (
    <div className="admin-page">
      <PageHeader
        title="Người dùng"
        description="Theo dõi tài khoản, số dư kim cương và tình trạng học tập của người dùng."
      />

      {successMessage ? (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 font-bold"
          >
            ×
          </button>
        </div>
      ) : null}

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
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val)
            setPage(1)
          }}
          placeholder="Tìm email hoặc tên..."
        />
        <select
          className="admin-select"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value)
            setPage(1)
          }}
          aria-label="Lọc trạng thái"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="LOCKED">Đã khóa</option>
          <option value="BANNED">Đã cấm</option>
        </select>
        <div className="ml-auto text-xs text-slate-500 font-semibold self-center">
          Tổng số: <strong className="text-slate-800">{totalUsers}</strong> tài khoản
        </div>
      </div>

      <DataTable
        headers={['Người dùng', 'Email', 'Kim Cương 💎', 'Tim ❤️', 'XP', 'Trạng thái', 'Thao tác']}
        caption="Danh sách người dùng"
      >
        {loading ? (
          <tr>
            <td colSpan={7} className="text-center py-6 text-slate-500">
              Đang tải dữ liệu người dùng từ cơ sở dữ liệu...
            </td>
          </tr>
        ) : users.length === 0 ? (
          <tr>
            <td colSpan={7} className="text-center py-6 text-slate-500">
              Không tìm thấy người dùng phù hợp.
            </td>
          </tr>
        ) : (
          users.map((user) => (
            <tr key={user.id}>
              <td className="admin-table__primary">
                <div className="flex items-center gap-2">
                  <span>{user.name}</span>
                  {user.role === 'ADMIN' ? (
                    <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-purple-100 text-purple-700 rounded-md">
                      ADMIN
                    </span>
                  ) : null}
                </div>
              </td>
              <td>{user.email}</td>
              <td>
                <span className="font-extrabold text-cyan-600 bg-cyan-50 px-2 py-1 rounded-lg border border-cyan-100">
                  💎 {(user.diamond ?? 0).toLocaleString('vi-VN')}
                </span>
              </td>
              <td>
                <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg text-xs">
                  ❤️ {user.currentHeart ?? 5}/{user.maxHeart ?? 5}
                </span>
              </td>
              <td>{(user.totalXp ?? 0).toLocaleString('vi-VN')}</td>
              <td>
                <StatusBadge status={user.status} />
              </td>
              <td>
                <span className="admin-actions">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(user)}
                    className="admin-button admin-button--primary admin-button--small"
                    title="Cộng hoặc trừ kim cương của người dùng này"
                  >
                    💎 Cộng/Trừ
                  </button>
                  <Link
                    to={`/admin/users/${user.id}`}
                    className="admin-button admin-button--secondary admin-button--small"
                  >
                    Chi tiết
                  </Link>
                </span>
              </td>
            </tr>
          ))
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

      {/* Modal Adjust Diamond */}
      <AdjustDiamondModal
        isOpen={Boolean(selectedUser)}
        user={selectedUser}
        isLoading={isAdjusting}
        onConfirm={handleAdjustDiamonds}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  )
}
