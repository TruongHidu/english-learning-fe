import { useState, useEffect } from 'react'

export type AnswerState = 'idle' | 'selected' | 'correct' | 'incorrect'

interface AnswerOptionProps {
  content: string
  state: AnswerState
  disabled?: boolean
  onClick: () => void
}

export default function AnswerOption({
  content,
  state,
  disabled = false,
  onClick,
}: AnswerOptionProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  // Trigger click animation
  useEffect(() => {
    if (state === 'selected') {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 150)
      return () => clearTimeout(timer)
    }
  }, [state])

  let baseClasses = 'w-full rounded-2xl border-2 px-5 py-4 text-left text-lg font-bold transition-all relative outline-none'
  let stateClasses = ''

  switch (state) {
    case 'idle':
      stateClasses = 'border-slate-200 bg-white text-slate-700 shadow-[0_2px_0_#e2e8f0] hover:bg-slate-50 hover:border-slate-300'
      break
    case 'selected':
      stateClasses = 'border-sky-400 bg-sky-50 text-sky-600 shadow-[0_2px_0_#38bdf8]'
      break
    case 'correct':
      stateClasses = 'border-emerald-500 bg-emerald-50 text-emerald-600'
      break
    case 'incorrect':
      stateClasses = 'border-rose-500 bg-rose-50 text-rose-500'
      break
  }

  // Animation classes
  const animClasses = isAnimating ? 'scale-[0.98]' : 'scale-100'
  const shakeClasses = state === 'incorrect' ? 'animate-[shake_0.5s_ease-in-out]' : ''

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${stateClasses} ${animClasses} ${shakeClasses} ${
        disabled && state !== 'correct' && state !== 'incorrect' && state !== 'selected' 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer active:translate-y-[2px] active:shadow-none'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex-1">{content}</span>
        
        {/* Status icon (optional, purely visual) */}
        {state === 'correct' && (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
        {state === 'incorrect' && (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        )}
      </div>
    </button>
  )
}
