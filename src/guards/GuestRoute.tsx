import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import RouteLoading from './RouteLoading'

export default function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth()

  if (isInitializing) return <RouteLoading />
  if (isAuthenticated) return <Navigate to="/learn" replace />

  return children
}
