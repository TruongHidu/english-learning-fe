export default function RouteLoading() {
  return (
    <main className="route-loading" aria-live="polite" aria-busy="true">
      <span className="route-loading__spinner" aria-hidden="true" />
      <span>Đang tải...</span>
    </main>
  )
}
