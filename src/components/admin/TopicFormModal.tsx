import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { topicFormSchema, type TopicFormValues } from '../../schemas/topic.schema'
import type { TopicResponse } from '../../types/topic.types'

interface TopicFormModalProps {
  isOpen: boolean
  topic?: TopicResponse | null
  nextOrderIndex?: number
  isLoading: boolean
  serverNameError?: string | null
  onSubmit: (values: TopicFormValues) => Promise<void>
  onClose: () => void
}

export default function TopicFormModal({ isOpen, topic, nextOrderIndex = 0, isLoading, serverNameError, onSubmit, onClose }: TopicFormModalProps) {
  const isEdit = Boolean(topic)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TopicFormValues>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: { name: '', description: '', orderIndex: nextOrderIndex, status: 'DRAFT' },
  })

  useEffect(() => {
    if (!isOpen) return
    reset(topic ? { name: topic.name, description: topic.description ?? '', orderIndex: topic.orderIndex, status: topic.status } : { name: '', description: '', orderIndex: nextOrderIndex, status: 'DRAFT' })
  }, [isOpen, nextOrderIndex, reset, topic])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="topic-form-title">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border-2 border-slate-200 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100"><h2 id="topic-form-title" className="text-xl font-extrabold text-slate-800">{isEdit ? 'Chỉnh sửa Topic' : 'Thêm Topic'}</h2><button type="button" className="text-slate-500 p-2" onClick={onClose} disabled={isLoading} aria-label="Đóng">×</button></div>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div><label className="block text-xs font-extrabold text-slate-700 mb-1.5" htmlFor="topic-name">Tên Topic *</label><input id="topic-name" autoFocus className="admin-field" {...register('name')} />{errors.name?.message || serverNameError ? <p className="text-rose-600 text-xs mt-1">{errors.name?.message ?? serverNameError}</p> : null}</div>
          <div><label className="block text-xs font-extrabold text-slate-700 mb-1.5" htmlFor="topic-description">Mô tả</label><textarea id="topic-description" rows={4} className="admin-textarea" {...register('description')} />{errors.description ? <p className="text-rose-600 text-xs mt-1">{errors.description.message}</p> : null}</div>
          {!isEdit ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-xs font-extrabold text-slate-700 mb-1.5" htmlFor="topic-order">Thứ tự *</label><input id="topic-order" type="number" min={0} className="admin-field" {...register('orderIndex', { valueAsNumber: true })} />{errors.orderIndex ? <p className="text-rose-600 text-xs mt-1">{errors.orderIndex.message}</p> : null}</div><div><label className="block text-xs font-extrabold text-slate-700 mb-1.5" htmlFor="topic-status">Trạng thái</label><select id="topic-status" className="admin-field" {...register('status')}><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Đã phát hành</option><option value="INACTIVE">Ngừng sử dụng</option></select></div></div> : null}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100"><button type="button" className="admin-button admin-button--secondary" onClick={onClose} disabled={isLoading}>Hủy</button><button type="submit" className="admin-button admin-button--primary" disabled={isLoading}>{isLoading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo Topic'}</button></div>
        </form>
      </div>
    </div>
  )
}
