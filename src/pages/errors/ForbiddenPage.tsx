import { Link } from 'react-router-dom'

export default function ForbiddenPage() {
  return (
    <main className="status-page">
      <div>
        <strong>403</strong>
        <h1>Bạn không có quyền truy cập trang này.</h1>
        <Link to="/learn">Quay về trang chính</Link>
      </div>
    </main>
  )
}
