import { useState, useEffect, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import DataTable from '../../components/admin/DataTable'
import EmptyState from '../../components/admin/EmptyState'
import PageHeader from '../../components/admin/PageHeader'
import StatCard from '../../components/admin/StatCard'
import StatusBadge from '../../components/admin/StatusBadge'
import ConfirmModal from '../../components/admin/ConfirmModal'
import AdjustDiamondModal from '../../components/admin/AdjustDiamondModal'
import {
  adminDiamondService,
  type AdminUserDetail,
  type AdminUserProgressData,
  type AdminUserVocabulariesData,
  type AdminDiamondTransactionItem,
} from '../../services/admin-diamond.service'

type UserTab = 'overview' | 'progress' | 'words' | 'transactions'

const TX_TYPE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
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

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const [tab, setTab] = useState<UserTab>('overview')

  // User details
  const [user, setUser] = useState<AdminUserDetail | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [userError, setUserError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Progress Tab Data
  const [progressData, setProgressData] = useState<AdminUserProgressData | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(false)

  // Vocabularies Tab Data
  const [vocabData, setVocabData] = useState<AdminUserVocabulariesData | null>(null)
  const [loadingVocab, setLoadingVocab] = useState(false)
  const [vocabPage, setVocabPage] = useState(1)

  // Transactions Tab Data
  const [transactions, setTransactions] = useState<AdminDiamondTransactionItem[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [txPage, setTxPage] = useState(1)
  const [txTotalPages, setTxTotalPages] = useState(1)
  const [txTotalCount, setTxTotalCount] = useState(0)

  // Modal Adjust Diamond
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [isAdjusting, setIsAdjusting] = useState(false)

  // Modal Lock / Unlock Status
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'Chưa có'
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

  // 1. Fetch User Detail
  const fetchUserDetail = useCallback(async () => {
    if (!userId) return
    try {
      setLoadingUser(true)
      setUserError(null)
      const data = await adminDiamondService.getUserDetail(userId)
      setUser(data)
    } catch (err: any) {
      console.error('Lỗi tải chi tiết người dùng:', err)
      setUserError(err?.response?.data?.message || 'Không thể tải thông tin người dùng.')
    } finally {
      setLoadingUser(false)
    }
  }, [userId])

  useEffect(() => {
    fetchUserDetail()
  }, [fetchUserDetail])

  // 2. Fetch Progress when tab is clicked
  useEffect(() => {
    if (tab !== 'progress' || !userId || progressData) return
    let isMounted = true
    async function loadProgress() {
      try {
        setLoadingProgress(true)
        const data = await adminDiamondService.getUserProgress(userId!)
        if (isMounted) setProgressData(data)
      } catch (err: any) {
        console.error('Lỗi tải tiến độ học:', err)
      } finally {
        if (isMounted) setLoadingProgress(false)
      }
    }
    loadProgress()
    return () => {
      isMounted = false
    }
  }, [tab, userId, progressData])

  // 3. Fetch Vocabularies when tab is clicked or page changes
  useEffect(() => {
    if (tab !== 'words' || !userId) return
    let isMounted = true
    async function loadVocabularies() {
      try {
        setLoadingVocab(true)
        const data = await adminDiamondService.getUserVocabularies(userId!, {
          page: vocabPage,
          limit: 10,
        })
        if (isMounted) setVocabData(data)
      } catch (err: any) {
        console.error('Lỗi tải danh sách từ vựng:', err)
      } finally {
        if (isMounted) setLoadingVocab(false)
      }
    }
    loadVocabularies()
    return () => {
      isMounted = false
    }
  }, [tab, userId, vocabPage])

  // 4. Fetch Transactions when tab is clicked or page changes
  const fetchTransactions = useCallback(async () => {
    if (tab !== 'transactions' || !userId) return
    try {
      setLoadingTransactions(true)
      const data = await adminDiamondService.getTransactions({
        userId,
        page: txPage,
        limit: 10,
      })
      setTransactions(data.transactions)
      setTxTotalPages(data.totalPages)
      setTxTotalCount(data.total)
    } catch (err: any) {
      console.error('Lỗi tải lịch sử giao dịch:', err)
    } finally {
      setLoadingTransactions(false)
    }
  }, [tab, userId, txPage])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Handler: Adjust Diamond
  const handleAdjustDiamonds = async (amount: number, reason: string) => {
    if (!user) return
    try {
      setIsAdjusting(true)
      const res = await adminDiamondService.adjustDiamonds(user.id, {
        amount,
        reason,
      })
      setUser((prev) => (prev ? { ...prev, diamond: res.user.diamond } : null))
      setSuccessMessage(
        `Đã điều chỉnh thành công ${amount > 0 ? `+${amount}` : amount} 💎 cho tài khoản ${user.email}. Số dư mới: ${res.user.diamond} 💎`
      )

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bc = new BroadcastChannel('lingofox_realtime')
          bc.postMessage({
            type: 'DIAMOND_UPDATED',
            userId: user.id,
            diamond: res.user.diamond,
            change: amount,
            reason,
          })
          bc.close()
        } catch {
          // ignore
        }
      }

      setIsAdjustModalOpen(false)
      if (tab === 'transactions') {
        fetchTransactions()
      }
      setTimeout(() => setSuccessMessage(null), 6000)
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể điều chỉnh kim cương. Vui lòng thử lại.')
    } finally {
      setIsAdjusting(false)
    }
  }

  // Handler: Toggle Lock / Unlock Status
  const handleToggleStatus = async () => {
    if (!user) return
    const targetStatus = user.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED'
    try {
      setIsTogglingStatus(true)
      await adminDiamondService.updateUserStatus(user.id, targetStatus)
      setUser((prev) => (prev ? { ...prev, status: targetStatus } : null))
      setSuccessMessage(
        `Đã ${targetStatus === 'LOCKED' ? 'khóa' : 'mở khóa'} tài khoản ${user.email} thành công.`
      )
      setIsStatusModalOpen(false)
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể cập nhật trạng thái người dùng.')
    } finally {
      setIsTogglingStatus(false)
    }
  }

  if (loadingUser) {
    return (
      <div className="admin-page">
        <PageHeader eyebrow="Người dùng" title="Đang tải thông tin..." />
        <div className="py-12 text-center text-slate-500 font-semibold">
          Đang truy xuất thông tin chi tiết người dùng từ hệ thống...
        </div>
      </div>
    )
  }

  if (!user || userError) {
    return (
      <EmptyState
        title="Không tìm thấy người dùng"
        description={userError || 'Tài khoản người dùng này không tồn tại trên hệ thống.'}
        action={
          <Link to="/admin/users" className="admin-button admin-button--secondary">
            Quay lại danh sách
          </Link>
        }
      />
    )
  }

  const targetStatus = user.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED'

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Chi tiết người dùng"
        title={user.name}
        description={`${user.email} • Tham gia từ ${formatDate(user.createdAt)}`}
        action={
          <div className="flex items-center gap-2">
            <Link
              to="/admin/users"
              className="admin-button admin-button--secondary admin-button--small"
            >
              ← Danh sách
            </Link>
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(true)}
              className="admin-button admin-button--primary admin-button--small"
            >
              💎 Cộng/Trừ
            </button>
            <button
              type="button"
              disabled={user.role === 'ADMIN'}
              onClick={() => setIsStatusModalOpen(true)}
              className={`admin-button admin-button--small ${
                user.status === 'LOCKED'
                  ? 'admin-button--primary'
                  : 'admin-button--danger'
              }`}
              title={
                user.role === 'ADMIN'
                  ? 'Không thể khóa tài khoản Quản trị viên'
                  : user.status === 'LOCKED'
                  ? 'Mở khóa tài khoản này'
                  : 'Khóa tài khoản này'
              }
            >
              {user.status === 'LOCKED' ? 'Mở khóa' : 'Khóa'}
            </button>
            <StatusBadge status={user.status} size="md" />
          </div>
        }
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

      <div className="admin-tabs" role="tablist">
        {(
          [
            ['overview', 'Tổng quan'],
            ['progress', 'Tiến độ học'],
            ['words', 'Từ đã học'],
            ['transactions', 'Biến động kim cương 💎'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: TỔNG QUAN */}
      {tab === 'overview' ? (
        <>
          <section className="admin-stat-grid">
            <StatCard
              label="Trái tim"
              value={`❤️ ${user.currentHeart} / ${user.maxHeart}`}
              tone="green"
              note="Số tim hiện có của học viên"
            />
            <StatCard
              label="Kim cương"
              value={`💎 ${(user.diamond ?? 0).toLocaleString('vi-VN')}`}
              tone="blue"
              note="Số dư kim cương hiện tại"
            />
            <StatCard
              label="Cấp độ học viên"
              value={`Cấp ${user.level ?? 1}`}
              tone="violet"
              note="Dựa trên kinh nghiệm học tập"
            />
            <StatCard
              label="Kinh nghiệm & Chuỗi"
              value={`⚡ ${(user.totalXp ?? 0).toLocaleString('vi-VN')} XP`}
              tone="amber"
              note={`🔥 Chuỗi: ${user.currentStreak} ngày (Kỷ lục: ${user.longestStreak})`}
            />
          </section>

          <section className="admin-card">
            <dl className="admin-detail-list">
              <div>
                <dt>Display name</dt>
                <dd className="font-bold text-slate-800">{user.name}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>Vai trò (Role)</dt>
                <dd>
                  <span className={`px-2 py-0.5 text-xs font-extrabold rounded-md ${
                    user.role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {user.role}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Trạng thái tài khoản</dt>
                <dd>
                  <StatusBadge status={user.status} />
                </dd>
              </div>
              <div>
                <dt>Phương thức xác thực</dt>
                <dd className="font-semibold text-slate-700">
                  {user.authProvider === 'GOOGLE' ? 'Google OAuth' : 'Email / Mật khẩu'}
                </dd>
              </div>
              <div>
                <dt>Ngày đăng ký</dt>
                <dd>{formatDate(user.createdAt)}</dd>
              </div>
              <div>
                <dt>Học gần nhất</dt>
                <dd>{formatDate(user.lastStudyDate)}</dd>
              </div>
              <div>
                <dt>Đăng nhập gần nhất</dt>
                <dd>{formatDate(user.lastLoginAt)}</dd>
              </div>
            </dl>
          </section>
        </>
      ) : null}

      {/* TAB 2: TIẾN ĐỘ HỌC */}
      {tab === 'progress' ? (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-600">
              Tổng số bài học hoàn thành:{' '}
              <strong className="text-emerald-600 text-sm">
                {progressData?.totalCompletedLessons ?? 0}
              </strong>{' '}
              bài
            </div>
          </div>

          <DataTable
            headers={['Khóa học', 'Trình độ', 'Số bài hoàn thành', 'Tiến độ']}
            caption="Tiến độ học các khóa học"
          >
            {loadingProgress ? (
              <tr>
                <td colSpan={4} className="text-center py-6 text-slate-500">
                  Đang tải tiến độ học tập của người dùng...
                </td>
              </tr>
            ) : !progressData || progressData.courses.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-6 text-slate-500">
                  Người dùng chưa tham gia bài học nào trong hệ thống.
                </td>
              </tr>
            ) : (
              progressData.courses.map((c) => (
                <tr key={c.courseId}>
                  <td className="admin-table__primary">
                    <div className="font-bold text-slate-800">{c.courseName}</div>
                  </td>
                  <td>
                    <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-slate-100 text-slate-700">
                      {c.level}
                    </span>
                  </td>
                  <td>
                    <span className="font-semibold text-slate-700">
                      {c.completedLessons} / {c.totalLessons} bài
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <div className="admin-progress">
                        <span style={{ width: `${c.progressPercent}%` }} />
                      </div>
                      <strong>{c.progressPercent}%</strong>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </DataTable>
        </div>
      ) : null}

      {/* TAB 3: TỪ ĐÃ HỌC */}
      {tab === 'words' ? (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-600">
              Tổng từ vựng đã ghi nhận:{' '}
              <strong className="text-blue-600 text-sm">
                {vocabData?.total ?? 0}
              </strong>{' '}
              từ
            </div>
          </div>

          <DataTable
            headers={['Từ vựng', 'Phiên âm', 'Nghĩa', 'Từ loại / Độ khó', 'Cấp độ SRS', 'Ngày học']}
            caption="Từ vựng người dùng đã học"
          >
            {loadingVocab ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-500">
                  Đang tải danh sách từ vựng đã học...
                </td>
              </tr>
            ) : !vocabData || vocabData.vocabularies.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-500">
                  Người dùng chưa học từ vựng nào.
                </td>
              </tr>
            ) : (
              vocabData.vocabularies.map((w) => (
                <tr key={w.id}>
                  <td className="admin-table__primary">
                    <span className="font-extrabold text-slate-800 text-sm">{w.word}</span>
                  </td>
                  <td className="text-slate-500 font-mono text-xs">
                    {w.phonetic ? `/${w.phonetic}/` : '—'}
                  </td>
                  <td className="font-semibold text-slate-700">{w.meaning}</td>
                  <td>
                    <span className="text-xs text-slate-500 font-medium">
                      {w.partOfSpeech || '—'} • {w.difficulty || '—'}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-block w-fit">
                        ⭐ Cấp {w.reviewLevel}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Đúng: {w.correctCount} | Sai: {w.incorrectCount}
                      </span>
                    </div>
                  </td>
                  <td className="text-xs text-slate-600">{formatDate(w.learnedAt)}</td>
                </tr>
              ))
            )}
          </DataTable>

          {/* Pagination controls for Vocabularies */}
          {vocabData && vocabData.totalPages > 1 ? (
            <div className="flex items-center justify-between mt-4 px-2">
              <div className="text-xs text-slate-500">
                Trang <strong className="text-slate-800">{vocabPage}</strong> / {vocabData.totalPages}
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={vocabPage <= 1 || loadingVocab}
                  onClick={() => setVocabPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  Trước
                </button>
                <button
                  type="button"
                  disabled={vocabPage >= vocabData.totalPages || loadingVocab}
                  onClick={() => setVocabPage((p) => Math.min(vocabData.totalPages, p + 1))}
                  className="px-3 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  Sau
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* TAB 4: BIẾN ĐỘNG KIM CƯƠNG */}
      {tab === 'transactions' ? (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-600">
              Lịch sử biến động kim cương:{' '}
              <strong className="text-cyan-600 text-sm">{txTotalCount}</strong> giao dịch
            </div>
          </div>

          <DataTable
            headers={['Mã GD', 'Loại giao dịch', 'Biến động 💎', 'Số dư (Trước → Sau)', 'Lý do', 'Thời gian']}
            caption="Lịch sử biến động kim cương của người dùng"
          >
            {loadingTransactions ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-500">
                  Đang tải lịch sử giao dịch kim cương...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-500">
                  Chưa có lịch sử biến động kim cương nào cho người dùng này.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const conf = TX_TYPE_CONFIG[tx.type] || {
                  label: tx.type,
                  bg: 'bg-slate-50',
                  text: 'text-slate-700',
                  border: 'border-slate-200',
                }
                const isPositive = tx.amount > 0

                return (
                  <tr key={tx.id}>
                    <td className="admin-table__primary font-mono text-xs text-slate-500">
                      #{tx.id.slice(-8).toUpperCase()}
                    </td>
                    <td>
                      <span
                        className={`px-2 py-1 text-xs font-extrabold rounded-lg border ${conf.bg} ${conf.text} ${conf.border}`}
                      >
                        {conf.label}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`font-black text-xs px-2 py-1 rounded-lg border ${
                          isPositive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {isPositive ? `+${tx.amount}` : tx.amount} 💎
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 font-mono text-xs text-slate-600">
                        <span className="font-semibold">{tx.balanceBefore}</span>
                        <span>→</span>
                        <span className="font-extrabold text-cyan-600">{tx.balanceAfter} 💎</span>
                      </div>
                    </td>
                    <td className="text-xs text-slate-700 max-w-xs truncate" title={tx.description}>
                      {tx.description || '—'}
                    </td>
                    <td className="text-xs text-slate-500">{formatDate(tx.createdAt)}</td>
                  </tr>
                )
              })
            )}
          </DataTable>

          {/* Pagination controls for Transactions */}
          {txTotalPages > 1 ? (
            <div className="flex items-center justify-between mt-4 px-2">
              <div className="text-xs text-slate-500">
                Trang <strong className="text-slate-800">{txPage}</strong> / {txTotalPages}
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={txPage <= 1 || loadingTransactions}
                  onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  Trước
                </button>
                <button
                  type="button"
                  disabled={txPage >= txTotalPages || loadingTransactions}
                  onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}
                  className="px-3 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  Sau
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Modal Adjust Diamond */}
      <AdjustDiamondModal
        isOpen={isAdjustModalOpen}
        user={user}
        isLoading={isAdjusting}
        onConfirm={handleAdjustDiamonds}
        onClose={() => setIsAdjustModalOpen(false)}
      />

      {/* Modal Confirm Lock / Unlock */}
      <ConfirmModal
        isOpen={isStatusModalOpen}
        title={targetStatus === 'LOCKED' ? 'Khóa tài khoản người dùng' : 'Mở khóa tài khoản người dùng'}
        message={
          targetStatus === 'LOCKED'
            ? `Bạn có chắc chắn muốn KHÓA tài khoản “${user.name}” (${user.email})? Người dùng sẽ bị chặn đăng nhập vào hệ thống ngay lập tức.`
            : `Bạn có muốn MỞ KHÓA tài khoản “${user.name}” (${user.email}) để người dùng đăng nhập và học tập bình thường?`
        }
        confirmLabel={targetStatus === 'LOCKED' ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}
        confirmVariant={targetStatus === 'LOCKED' ? 'danger' : 'primary'}
        isLoading={isTogglingStatus}
        onConfirm={() => void handleToggleStatus()}
        onClose={() => setIsStatusModalOpen(false)}
      />
    </div>
  )
}
