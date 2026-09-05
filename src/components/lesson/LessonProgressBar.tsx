import { Link } from 'react-router-dom'

interface LessonProgressBarProps {
  current: number
  total: number
  hearts: number
  maxHearts?: number
  diamonds?: number
  backUrl?: string
  onRequestExit?: () => void
}

export default function LessonProgressBar({
  current,
  total,
  hearts,
  backUrl = '/learn',
  onRequestExit,
}: LessonProgressBarProps) {
  const percent = total > 0 ? Math.min(100, (current / total) * 100) : 0

  return (
    <header className="mb-8 flex items-center gap-4">
      {/* Close / Back */}
      {onRequestExit ? (
        <button
          type="button"
          onClick={onRequestExit}
          aria-label="Thoát bài học"
          className="shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      ) : (
        <Link
          to={backUrl}
          aria-label="Thoát bài học"
          className="shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </Link>
      )}

      {/* Progress track */}
      <div className="flex-1">
        <div
          className="h-4 w-full overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={current}
          aria-label={`Tiến độ: ${current} trên ${total}`}
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Heart indicator (static, non-interactive) */}
      <div
        className="flex shrink-0 items-center gap-2 font-black text-rose-500"
        aria-label={`${hearts} trái tim`}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#f43f5e" aria-hidden="true">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span className="text-lg">{hearts}</span>
      </div>
    </header>
  )
}
