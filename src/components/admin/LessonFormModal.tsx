import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { lessonFormSchema, type LessonFormValues } from '../../schemas/lesson.schema'
import type { LessonResponse } from '../../types/lesson.types'

interface LessonFormModalProps {
  isOpen: boolean
  lesson?: LessonResponse | null
  nextOrderIndex?: number
  isLoading: boolean
  serverNameError?: string | null
  onSubmit: (values: LessonFormValues) => Promise<void>
  onClose: () => void
}

export default function LessonFormModal({ isOpen, lesson, nextOrderIndex = 0, isLoading, serverNameError, onSubmit, onClose }: LessonFormModalProps) {
  const isEdit = Boolean(lesson)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LessonFormValues>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: { name: '', description: '', requiredScore: 70, questionCount: 10, xpReward: 50, diamondReward: 5, orderIndex: nextOrderIndex, status: 'DRAFT' },
  })

  useEffect(() => {
    if (!isOpen) return
    reset(lesson ? { name: lesson.name, description: lesson.description ?? '', requiredScore: lesson.requiredScore, questionCount: lesson.questionCount, xpReward: lesson.xpReward, diamondReward: lesson.diamondReward, orderIndex: lesson.orderIndex, status: lesson.status } : { name: '', description: '', requiredScore: 70, questionCount: 10, xpReward: 50, diamondReward: 5, orderIndex: nextOrderIndex, status: 'DRAFT' })
  }, [isOpen, lesson, nextOrderIndex, reset])

  if (!isOpen) return null

  const numberFields: Array<{ key: 'requiredScore' | 'questionCount' | 'xpReward' | 'diamondReward'; label: string; min: number; max?: number }> = [
    { key: 'requiredScore', label: 'Điểm yêu cầu (%)', min: 0, max: 100 },
    { key: 'questionCount', label: 'Số câu hỏi', min: 1, max: 100 },
    { key: 'xpReward', label: 'XP thưởng', min: 0 },
    { key: 'diamondReward', label: 'Kim cương thưởng', min: 0 },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="lesson-form-title">
      <div className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl border-2 border-slate-200 overflow-y-auto max-h-[92vh]">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100"><h2 id="lesson-form-title" className="text-xl font-extrabold text-slate-800">{isEdit ? 'Chỉnh sửa Lesson' : 'Thêm Lesson'}</h2><button type="button" className="text-slate-500 p-2" onClick={onClose} disabled={isLoading} aria-label="Đóng">×</button></div>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div><label className="block text-xs font-extrabold text-slate-700 mb-1.5" htmlFor="lesson-name">Tên Lesson *</label><input id="lesson-name" autoFocus className="admin-field" {...register('name')} />{errors.name?.message || serverNameError ? <p className="text-rose-600 text-xs mt-1">{errors.name?.message ?? serverNameError}</p> : null}</div>
          <div><label className="block text-xs font-extrabold text-slate-700 mb-1.5" htmlFor="lesson-description">Mô tả</label><textarea id="lesson-description" rows={3} className="admin-textarea" {...register('description')} />{errors.description ? <p className="text-rose-600 text-xs mt-1">{errors.description.message}</p> : null}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{numberFields.map((field) => <div key={field.key}><label className="block text-xs font-extrabold text-slate-700 mb-1.5" htmlFor={`lesson-${field.key}`}>{field.label} *</label><input id={`lesson-${field.key}`} type="number" min={field.min} max={field.max} className="admin-field" {...register(field.key, { valueAsNumber: true })} />{errors[field.key] ? <p className="text-rose-600 text-xs mt-1">{errors[field.key]?.message}</p> : null}</div>)}</div>
          {!isEdit ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-xs font-extrabold text-slate-700 mb-1.5" htmlFor="lesson-order">Thứ tự *</label><input id="lesson-order" type="number" min={0} className="admin-field" {...register('orderIndex', { valueAsNumber: true })} />{errors.orderIndex ? <p className="text-rose-600 text-xs mt-1">{errors.orderIndex.message}</p> : null}</div><div><label className="block text-xs font-extrabold text-slate-700 mb-1.5" htmlFor="lesson-status">Trạng thái</label><select id="lesson-status" className="admin-field" {...register('status')}><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Đã phát hành</option><option value="INACTIVE">Ngừng sử dụng</option></select></div></div> : null}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100"><button type="button" className="admin-button admin-button--secondary" onClick={onClose} disabled={isLoading}>Hủy</button><button type="submit" className="admin-button admin-button--primary" disabled={isLoading}>{isLoading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo Lesson'}</button></div>
        </form>
      </div>
    </div>
  )
}
