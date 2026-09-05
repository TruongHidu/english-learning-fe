import { useState, useEffect } from 'react'
import type { AdminUserItem } from '../../services/admin-diamond.service'

interface AdjustDiamondModalProps {
  isOpen: boolean
  user: AdminUserItem | null
  isLoading?: boolean
  onConfirm: (amount: number, reason: string) => Promise<void> | void
  onClose: () => void
}

export default function AdjustDiamondModal({
  isOpen,
  user,
  isLoading = false,
  onConfirm,
  onClose,
}: AdjustDiamondModalProps) {
  const [amount, setAmount] = useState<number>(50)
  const [reason, setReason] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      setAmount(50)
      setReason('')
      setError('')
    }
  }, [isOpen, user])

  if (!isOpen || !user) return null

  const currentBalance = user.diamond || 0
  const afterBalance = currentBalance + (Number(amount) || 0)
  const isInvalid = !amount || amount === 0 || afterBalance < 0 || !reason.trim()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isInvalid) {
      if (!amount || amount === 0) setError('Vui lòng nhập số lượng kim cương khác 0.')
      else if (afterBalance < 0) setError('Số dư sau điều chỉnh không thể âm.')
      else if (!reason.trim()) setError('Vui lòng nhập lý do điều chỉnh.')
      return
    }
    setError('')
    onConfirm(amount, reason.trim())
  }

  const quickPicks = [
    { label: '+50 💎', value: 50, color: 'emerald' },
    { label: '+100 💎', value: 100, color: 'emerald' },
    { label: '+500 💎', value: 500, color: 'emerald' },
    { label: '+1000 💎', value: 1000, color: 'emerald' },
    { label: '-20 💎', value: -20, color: 'rose' },
    { label: '-50 💎', value: -50, color: 'rose' },
    { label: '-100 💎', value: -100, color: 'rose' },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="adjust-diamond-title"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border-2 border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💎</span>
            <div>
              <h3 id="adjust-diamond-title" className="text-lg font-extrabold text-slate-800">
                Điều chỉnh Kim Cương
              </h3>
              <p className="text-xs text-slate-500">Cộng hoặc trừ kim cương của người dùng</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
          >
            ×
          </button>
        </div>

        {/* User preview card */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 mb-4 flex items-center justify-between">
          <div>
            <div className="font-bold text-sm text-slate-800">{user.name}</div>
            <div className="text-xs text-slate-500">{user.email}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-500">Số dư hiện tại</div>
            <div className="text-base font-black text-cyan-600 flex items-center gap-1 justify-end">
              <span>💎</span>
              <span>{currentBalance.toLocaleString('vi-VN')}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick presets */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
              Chọn nhanh số lượng
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickPicks.map((pick) => (
                <button
                  key={pick.value}
                  type="button"
                  onClick={() => setAmount(pick.value)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    amount === pick.value
                      ? pick.color === 'emerald'
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                        : 'bg-rose-500 text-white border-rose-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pick.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
              Số lượng điều chỉnh (Dương = Cộng, Âm = Trừ)
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="VD: 50 hoặc -20"
                className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-xl focus:outline-hidden focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                required
              />
              <span className="absolute right-3 top-2.5 text-sm font-bold text-slate-400">💎</span>
            </div>
          </div>

          {/* Balance Preview */}
          <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            afterBalance < 0
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-cyan-50 border-cyan-200 text-cyan-800'
          }`}>
            <span>Dự kiến sau điều chỉnh:</span>
            <span className="font-extrabold text-sm">
              {currentBalance} {amount >= 0 ? `+ ${amount}` : `- ${Math.abs(amount)}`} = {afterBalance} 💎
            </span>
          </div>

          {/* Reason input */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
              Lý do điều chỉnh <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Thưởng sự kiện đua top, đền bù mất dữ liệu, xử lý khiếu nại nạp..."
              rows={2}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 resize-none"
              required
            />
          </div>

          {error ? (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs font-semibold">
              {error}
            </div>
          ) : null}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading || isInvalid}
              className={`px-5 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer text-white disabled:opacity-50 ${
                amount < 0
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-[0_3px_0_#be123c]'
                  : 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_3px_0_#047857]'
              }`}
            >
              {isLoading ? 'Đang thực hiện...' : amount < 0 ? 'Xác nhận trừ kim cương' : 'Xác nhận cộng kim cương'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
