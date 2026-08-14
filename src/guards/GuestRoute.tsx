import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import RouteLoading from './RouteLoading'

export default function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing, user } = useAuth()

  if (isInitializing) return <RouteLoading />
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/learn'} replace />
  }

  return children
}
