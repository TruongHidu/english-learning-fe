interface LoadingStateProps {
  label?: string
}

export default function LoadingState({ label = 'Đang tải dữ liệu...' }: LoadingStateProps) {
  return (
    <div className="admin-state" aria-live="polite" aria-busy="true">
      <span className="admin-state__spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}
