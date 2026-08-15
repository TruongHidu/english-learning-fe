interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

export default function ErrorState({
  title = 'Không thể tải dữ liệu',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="admin-state admin-state--error" role="alert">
      <span className="admin-state__icon" aria-hidden="true">!</span>
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="admin-button admin-button--secondary" onClick={onRetry}>
          Thử lại
        </button>
      ) : null}
    </div>
  )
}
