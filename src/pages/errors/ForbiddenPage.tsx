import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function ForbiddenPage() {
  const { user } = useAuth()
  const homePath = user?.role === 'ADMIN' ? '/admin' : '/learn'

  return (
    <main className="status-page">
      <div>
        <strong>403</strong>
        <h1>Bạn không có quyền truy cập trang này.</h1>
        <Link to={homePath}>Quay về trang chính</Link>
      </div>
    </main>
  )
}
