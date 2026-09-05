import { useEffect, useState } from 'react'

export interface DiamondUpdateDetail {
  type: string
  diamond: number
  change: number
  reason: string
}

export default function RealtimeToast() {
  const [toast, setToast] = useState<DiamondUpdateDetail | null>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    const handleDiamondUpdated = (event: Event) => {
      const detail = (event as CustomEvent<DiamondUpdateDetail>).detail
      if (detail && detail.change !== undefined) {
        setToast(detail)
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
          setToast(null)
        }, 6000)
      }
    }

    window.addEventListener('DIAMOND_UPDATED', handleDiamondUpdated)
    return () => {
      window.removeEventListener('DIAMOND_UPDATED', handleDiamondUpdated)
      if (timer) clearTimeout(timer)
    }
  }, [])

  if (!toast) return null

  const isPositive = toast.change > 0

  return (
    <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-4 fade-in duration-300 max-w-sm">
      <div
        className={`p-4 rounded-2xl shadow-2xl border-2 flex items-start gap-3 backdrop-blur-sm ${
          isPositive
            ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950 shadow-emerald-500/10'
            : 'bg-rose-50/95 border-rose-300 text-rose-950 shadow-rose-500/10'
        }`}
      >
        <span className="text-3xl select-none">💎</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-extrabold text-sm text-slate-900">
              {isPositive ? `+${toast.change} Kim Cương!` : `${toast.change} Kim Cương`}
            </h4>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-700 font-bold text-base leading-none p-1 cursor-pointer"
            >
              ×
            </button>
          </div>
          <p className="text-xs mt-0.5 text-slate-700 leading-snug">
            {isPositive
              ? 'Quản trị viên vừa cộng thêm kim cương cho bạn.'
              : 'Quản trị viên vừa trừ bớt kim cương của bạn.'}
          </p>
          {toast.reason ? (
            <div className="mt-2 text-xs italic bg-white/80 px-2.5 py-1.5 rounded-lg border border-slate-200/80 font-medium text-slate-800 break-words">
              "{toast.reason}"
            </div>
          ) : null}
          <div className="mt-1.5 text-[11px] font-bold text-slate-500">
            Số dư ví mới:{' '}
            <span className="text-cyan-700 font-black">
              {toast.diamond.toLocaleString('vi-VN')} 💎
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
