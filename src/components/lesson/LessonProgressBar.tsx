import { Link } from 'react-router-dom'

interface LessonProgressBarProps {
  current: number
  total: number
  hearts: number
  maxHearts: number
  backUrl?: string
  onRequestExit?: () => void
}

export default function LessonProgressBar({
  current,
  total,
  hearts,
  maxHearts,
  backUrl = '/learn',
  onRequestExit,
}: LessonProgressBarProps) {
  const percent = total > 0 ? Math.min(100, (current / total) * 100) : 0
  const closeIcon = (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )

  return (
    <header className="mb-8 flex items-center justify-between gap-4">
      {onRequestExit ? (
        <button
          type="button"
          className="lesson-progress-close rounded-xl p-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          onClick={onRequestExit}
          aria-label="Thoát bài học"
          title="Thoát"
        >
          {closeIcon}
        </button>
      ) : (
        <Link
          to={backUrl}
          className="lesson-progress-close rounded-xl p-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          aria-label="Thoát bài học"
          title="Thoát"
        >
          {closeIcon}
        </Link>
      )}
      
      <div className="flex-1 max-w-2xl">
        <div 
          className="lesson-progress-track h-4 w-full overflow-hidden rounded-full"
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

      <div 
        className="flex items-center gap-2 font-black text-rose-500" 
        title={`Còn ${hearts} trên ${maxHearts} tim`}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="drop-shadow-sm"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span className="text-lg">{hearts}</span>
      </div>
    </header>
  )
}
