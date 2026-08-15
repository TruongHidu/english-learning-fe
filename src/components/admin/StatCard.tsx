import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  note?: string
  icon?: ReactNode
  tone?: 'green' | 'blue' | 'violet' | 'amber'
}

export default function StatCard({
  label,
  value,
  note,
  icon,
  tone = 'green',
}: StatCardProps) {
  return (
    <article className={`admin-stat-card admin-stat-card--${tone}`}>
      <div className="admin-stat-card__top">
        <span>{label}</span>
        {icon ? <span className="admin-stat-card__icon">{icon}</span> : null}
      </div>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </article>
  )
}
