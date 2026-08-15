import type { SectionResponse } from '../../types/course.types'
import StatusBadge from './StatusBadge'

interface AdminSectionCardProps {
  section: SectionResponse
  onEdit: (section: SectionResponse) => void
  onToggleStatus: (section: SectionResponse) => void
  onDeactivate: (section: SectionResponse) => void
}

export default function AdminSectionCard({ section, onEdit, onToggleStatus, onDeactivate }: AdminSectionCardProps) {
  return (
    <article className="admin-card admin-section-card">
      <span aria-hidden="true" style={{ color: '#9aa4b5', fontSize: 20, cursor: 'not-allowed' }}>☰</span>
      <div className="admin-section-card__content">
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}><strong className="admin-table__primary">Section {section.orderIndex}: {section.name}</strong><StatusBadge status={section.status} /></div>
        <p style={{ margin: '6px 0 0', color: '#7b8799', fontSize: 12 }}>{section.description || 'Chưa có mô tả.'}</p>
        <small style={{ display: 'block', marginTop: 7, color: '#9aa4b5' }}>Topics: chờ Topic API</small>
      </div>
      <div className="admin-actions admin-section-card__actions">
        <button type="button" className="admin-button admin-button--secondary admin-button--small" onClick={() => onEdit(section)}>Sửa</button>
        <button type="button" className="admin-button admin-button--secondary admin-button--small" disabled title="Topic API chưa có">+ Topic</button>
        {section.status !== 'INACTIVE' ? <><button type="button" className="admin-button admin-button--secondary admin-button--small" onClick={() => onToggleStatus(section)}>{section.status === 'PUBLISHED' ? 'Về nháp' : 'Xuất bản'}</button><button type="button" className="admin-button admin-button--danger admin-button--small" onClick={() => onDeactivate(section)}>Ngừng dùng</button></> : null}
      </div>
    </article>
  )
}
