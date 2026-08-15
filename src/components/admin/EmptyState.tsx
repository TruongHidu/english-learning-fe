import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
  icon?: ReactNode
}

export default function EmptyState({ title, description, action, icon = '○' }: EmptyStateProps) {
  return (
    <div className="admin-state admin-state--empty">
      <span className="admin-state__icon" aria-hidden="true">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}
