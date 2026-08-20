import { Link } from 'react-router-dom'

interface GameOverModalProps {
  isOpen: boolean
  courseId?: string
  sectionId?: string
  onRetry: () => void
}

export default function GameOverModal({ isOpen, courseId, sectionId, onRetry }: GameOverModalProps) {
  if (!isOpen) return null

  // Fallback URL if we don't have course context
  const backUrl = courseId && sectionId 
    ? `/learn/courses/${courseId}/sections/${sectionId}` 
    : '/learn'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div 
        className="learning-surface learning-surface--raised w-full max-w-md scale-100 rounded-3xl p-6 text-center shadow-2xl animate-[slideUp_0.3s_ease-out] md:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-over-title"
      >
        <div className="lesson-game-over-icon mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full text-6xl shadow-inner">
          💔
        </div>
        
        <h2 id="game-over-title" className="learning-heading-color mb-3 text-2xl font-black md:text-3xl">
          Bạn đã hết tim!
        </h2>
        
        <p className="learning-muted-color mb-8 text-base">
          Đừng nản chí nhé. Hãy nghỉ ngơi một chút rồi quay lại phục thù!
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="w-full rounded-xl bg-sky-500 px-5 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-[0_4px_0_#0284c7] transition-all hover:bg-sky-400 active:translate-y-1 active:shadow-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          >
            Thử lại ngay
          </button>
          
          <Link
            to={backUrl}
            className="lesson-secondary-action w-full rounded-xl border-2 px-5 py-3.5 text-sm font-black uppercase tracking-wider transition-all focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
          >
            Về trang học
          </Link>
        </div>
      </div>
    </div>
  )
}
