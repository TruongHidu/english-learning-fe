import type { ContentStatus } from '../../types/course.types'

interface StatusBadgeProps {
  status: ContentStatus
  size?: 'sm' | 'md'
}

const statusConfig: Record<
  ContentStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  PUBLISHED: {
    label: 'ĐÃ PHÁT HÀNH',
    bg: 'bg-emerald-50 text-emerald-700',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  DRAFT: {
    label: 'BẢN NHÁP',
    bg: 'bg-amber-50 text-amber-700',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  INACTIVE: {
    label: 'NGỪNG SỬ DỤNG',
    bg: 'bg-slate-100 text-slate-600',
    text: 'text-slate-600',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
  },
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.DRAFT

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border ${config.bg} ${config.border} ${
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs'
      }`}
    >
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  )
}
