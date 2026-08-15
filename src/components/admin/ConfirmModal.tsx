interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'danger' | 'warning' | 'primary'
  isLoading?: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'XÁC NHẬN',
  cancelLabel = 'HỦY BỎ',
  confirmVariant = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null

  const variantStyles = {
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-[0_4px_0_#9f1239] active:translate-y-1 active:shadow-none',
    warning:
      'bg-amber-500 hover:bg-amber-600 text-white shadow-[0_4px_0_#b45309] active:translate-y-1 active:shadow-none',
    primary:
      'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_4px_0_#047857] active:translate-y-1 active:shadow-none',
  }[confirmVariant]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border-2 border-slate-200">
        <h3 id="confirm-modal-title" className="text-xl font-extrabold text-slate-800 mb-2">
          {title}
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 font-bold text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 font-extrabold text-sm rounded-xl transition-all cursor-pointer disabled:opacity-50 ${variantStyles}`}
          >
            {isLoading ? 'ĐANG XỬ LÝ...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
