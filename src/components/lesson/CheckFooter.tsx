export type CheckFooterState = 'idle' | 'loading' | 'correct' | 'incorrect'

interface CheckFooterProps {
  state: CheckFooterState
  isDisabled?: boolean
  correctAnswer?: string | null
  explanation?: string | null
  onCheck: () => void
  onContinue: () => void
}

export default function CheckFooter({
  state,
  isDisabled = false,
  correctAnswer,
  explanation,
  onCheck,
  onContinue,
}: CheckFooterProps) {
  const isChecking = state === 'idle' || state === 'loading'
  const visualState = state === 'loading' ? 'idle' : state
  const wrapperClasses = `lesson-check-footer lesson-check-footer--${visualState} fixed bottom-0 left-0 right-0 z-10 border-t-2 p-4 transition-colors duration-300 md:p-6`
  const buttonClasses = `lesson-check-button ${
    visualState === 'incorrect' ? 'lesson-check-button--incorrect' : ''
  } w-full rounded-xl px-5 py-3.5 text-base font-black uppercase tracking-wider transition-all focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 md:w-auto md:min-w-[150px]`

  return (
    <footer className={wrapperClasses}>
      <div className="mx-auto flex max-w-4xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        
        {/* Feedback Section */}
        <div className="flex-1">
          {state === 'correct' && (
            <div className="lesson-check-feedback lesson-check-feedback--correct">
              <div className="flex items-center gap-3 mb-1">
                <div className="lesson-check-feedback__icon flex h-10 w-10 items-center justify-center rounded-full font-black">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h3 className="text-xl font-black md:text-2xl">Chính xác!</h3>
              </div>
              {explanation && (
                <div className="mt-2 text-sm italic opacity-80 pl-[52px]">
                  Giải thích: {explanation}
                </div>
              )}
            </div>
          )}
          
          {state === 'incorrect' && (
            <div className="lesson-check-feedback lesson-check-feedback--incorrect">
              <div className="mb-2 flex items-center gap-3">
                <div className="lesson-check-feedback__icon flex h-10 w-10 items-center justify-center rounded-full font-black">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </div>
                <h3 className="text-xl font-black md:text-2xl">Sai rồi</h3>
              </div>
              {correctAnswer && (
                <div className="mt-1 text-base md:text-lg pl-[52px]">
                  <span className="font-semibold opacity-90">Đáp án đúng là:</span>{' '}
                  <span className="font-black">{correctAnswer}</span>
                </div>
              )}
              {explanation && (
                <div className="mt-2 pl-[52px] text-sm italic opacity-90">
                  Giải thích: {explanation}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          type="button"
          disabled={isDisabled || state === 'loading'}
          onClick={isChecking ? onCheck : onContinue}
          className={buttonClasses}
        >
          {state === 'loading' && 'Đang kiểm tra...'}
          {state === 'idle' && 'Kiểm tra'}
          {(state === 'correct' || state === 'incorrect') && 'Tiếp tục'}
        </button>
      </div>
    </footer>
  )
}
