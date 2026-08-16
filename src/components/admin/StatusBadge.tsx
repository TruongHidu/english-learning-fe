interface StatusBadgeProps {
  status:
    | 'ACTIVE'
    | 'LOCKED'
    | 'BANNED'
    | 'DRAFT'
    | 'APPROVED'
    | 'REJECTED'
    | 'PUBLISHED'
    | 'INACTIVE'
    | 'PENDING'
    | 'SUCCESS'
    | 'FAILED'
    | 'CANCELLED'
  size?: 'sm' | 'md'
}

type AdminStatus = StatusBadgeProps['status']

const statusConfig: Record<AdminStatus, { label: string; className: string }> = {
  PUBLISHED: {
    label: 'ĐÃ PHÁT HÀNH',
    className: 'admin-status--success',
  },
  DRAFT: {
    label: 'BẢN NHÁP',
    className: 'admin-status--warning',
  },
  APPROVED: {
    label: 'ĐÃ DUYỆT',
    className: 'admin-status--success',
  },
  REJECTED: {
    label: 'TỪ CHỐI',
    className: 'admin-status--danger',
  },
  INACTIVE: {
    label: 'NGỪNG SỬ DỤNG',
    className: 'admin-status--neutral',
  },
  ACTIVE: { label: 'HOẠT ĐỘNG', className: 'admin-status--success' },
  LOCKED: { label: 'ĐÃ KHÓA', className: 'admin-status--warning' },
  BANNED: { label: 'ĐÃ CẤM', className: 'admin-status--danger' },
  PENDING: { label: 'ĐANG CHỜ', className: 'admin-status--warning' },
  SUCCESS: { label: 'THÀNH CÔNG', className: 'admin-status--success' },
  FAILED: { label: 'THẤT BẠI', className: 'admin-status--danger' },
  CANCELLED: { label: 'ĐÃ HỦY', className: 'admin-status--neutral' },
}


export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span className={`admin-status ${config.className} admin-status--${size}`}>
      <span className="admin-status__dot" aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  )
}
