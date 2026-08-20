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
  
  let wrapperClasses = 'fixed bottom-0 left-0 right-0 border-t-2 p-4 md:p-6 transition-colors duration-300 z-10'
  let buttonClasses = 'w-full md:w-auto md:min-w-[150px] rounded-xl px-5 py-3.5 text-base font-black uppercase tracking-wider text-white transition-all focus-visible:outline-3 focus-visible:outline-offset-2'
  
  if (state === 'idle' || state === 'loading') {
    wrapperClasses += ' bg-white border-slate-200'
    buttonClasses += isDisabled
      ? ' bg-slate-200 text-slate-400 cursor-not-allowed'
      : ' bg-emerald-500 shadow-[0_4px_0_#047857] hover:bg-emerald-600 active:translate-y-1 active:shadow-none focus-visible:outline-emerald-400'
  } else if (state === 'correct') {
    wrapperClasses += ' bg-green-100 border-green-200'
    buttonClasses += ' bg-green-500 shadow-[0_4px_0_#15803d] hover:bg-green-600 active:translate-y-1 active:shadow-none focus-visible:outline-green-400'
  } else if (state === 'incorrect') {
    wrapperClasses += ' bg-red-100 border-red-200'
    buttonClasses += ' bg-red-500 shadow-[0_4px_0_#b91c1c] hover:bg-red-600 active:translate-y-1 active:shadow-none focus-visible:outline-red-400'
  }

  return (
    <footer className={wrapperClasses}>
      <div className="mx-auto flex max-w-4xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        
        {/* Feedback Section */}
        <div className="flex-1">
          {state === 'correct' && (
            <div className="text-green-600">
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-black text-green-500 shadow-sm">
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
            <div className="text-red-600">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-black text-red-500 shadow-sm">
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
                  <span className="font-black text-red-700">{correctAnswer}</span>
                </div>
              )}
              {explanation && (
                <div className="mt-2 text-sm italic opacity-90 pl-[52px] text-red-800">
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
