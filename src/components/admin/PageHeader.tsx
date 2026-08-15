import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  action?: ReactNode
}

export default function PageHeader({
  title,
  description,
  eyebrow,
  action,
}: PageHeaderProps) {
  return (
    <div className="admin-page-header">
      <div>
        {eyebrow ? <span className="admin-page-header__eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="admin-page-header__action">{action}</div> : null}
    </div>
  )
}
