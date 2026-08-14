import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { sectionFormSchema, type SectionFormValues } from '../../schemas/section.schema'
import type { SectionResponse } from '../../types/course.types'

interface SectionFormModalProps {
  isOpen: boolean
  section?: SectionResponse | null
  isLoading?: boolean
  onSubmit: (values: SectionFormValues) => Promise<void>
  onClose: () => void
}

export default function SectionFormModal({
  isOpen,
  section,
  isLoading = false,
  onSubmit,
  onClose,
}: SectionFormModalProps) {
  const isEdit = !!section

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SectionFormValues>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues: {
      name: '',
      description: '',
      orderIndex: 0,
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (section) {
        reset({
          name: section.name,
          description: section.description ?? '',
          orderIndex: section.orderIndex,
        })
      } else {
        reset({
          name: '',
          description: '',
          orderIndex: 0,
        })
      }
    }
  }, [isOpen, section, reset])

  if (!isOpen) return null

  const handleFormSubmit = async (values: SectionFormValues) => {
    await onSubmit(values)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="section-form-title"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border-2 border-slate-200 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <h3 id="section-form-title" className="text-xl font-extrabold text-slate-800">
            {isEdit ? 'CHỈNH SỬA PHẦN HỌC' : 'THÊM PHẦN HỌC MỚI'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên phần học <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Phần 1: Chào hỏi và làm quen"
              {...register('name')}
              className={`w-full px-3.5 py-2.5 rounded-xl border-2 bg-slate-50 text-sm text-slate-800 font-medium focus:bg-white focus:outline-none transition-colors ${
                errors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'
              }`}
            />
            {errors.name && (
              <p className="text-rose-500 text-xs font-semibold mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Thứ tự sắp xếp <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              {...register('orderIndex', { valueAsNumber: true })}
              className={`w-full px-3.5 py-2.5 rounded-xl border-2 bg-slate-50 text-sm text-slate-800 font-medium focus:bg-white focus:outline-none transition-colors ${
                errors.orderIndex ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'
              }`}
            />
            {errors.orderIndex && (
              <p className="text-rose-500 text-xs font-semibold mt-1">{errors.orderIndex.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Mô tả phần học
            </label>
            <textarea
              rows={3}
              placeholder="Mô tả nội dung chính hoặc chủ đề của phần học..."
              {...register('description')}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-sm text-slate-800 font-medium focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
            />
            {errors.description && (
              <p className="text-rose-500 text-xs font-semibold mt-1">{errors.description.message}</p>
            )}
          </div>

          {!isEdit && (
            <p className="text-xs text-slate-500 italic bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              💡 Phần học mới sẽ được tạo ở trạng thái <strong>BẢN NHÁP (DRAFT)</strong>.
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 font-bold text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 cursor-pointer disabled:opacity-50"
            >
              HỦY
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 font-extrabold text-sm text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-[0_4px_0_#047857] active:translate-y-1 active:shadow-none transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'ĐANG LƯU...' : isEdit ? 'CẬP NHẬT' : 'THÊM PHẦN HỌC'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
