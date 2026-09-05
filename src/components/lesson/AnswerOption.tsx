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

  // Animation classes
  const animClasses = isAnimating ? 'scale-[0.98]' : 'scale-100'
  const shakeClasses = state === 'incorrect' ? 'animate-[shake_0.5s_ease-in-out]' : ''
  const disabledClasses =
    disabled && state === 'idle' ? 'lesson-answer-option--disabled' : ''

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`lesson-answer-option lesson-answer-option--${state} ${animClasses} ${shakeClasses} ${disabledClasses}`}
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
