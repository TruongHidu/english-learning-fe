import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  diamondPackageFormSchema,
  type DiamondPackageFormValues,
} from '../../schemas/diamond-package.schema'
import type { DiamondPackage } from '../../types/diamond-package.types'

interface DiamondPackageFormModalProps {
  isOpen: boolean
  packageData?: DiamondPackage | null
  isLoading?: boolean
  onSubmit: (values: DiamondPackageFormValues) => Promise<void>
  onClose: () => void
}

export default function DiamondPackageFormModal({
  isOpen,
  packageData,
  isLoading = false,
  onSubmit,
  onClose,
}: DiamondPackageFormModalProps) {
  const isEdit = !!packageData

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<DiamondPackageFormValues>({
    resolver: zodResolver(diamondPackageFormSchema),
    defaultValues: {
      name: '',
      diamondAmount: 100,
      bonusDiamond: 0,
      price: 19000,
      description: '',
      status: 'ACTIVE',
      orderIndex: 0,
    },
  })

  const diamondAmountWatch = watch('diamondAmount') || 0
  const bonusDiamondWatch = watch('bonusDiamond') || 0
  const totalDiamonds = (Number(diamondAmountWatch) || 0) + (Number(bonusDiamondWatch) || 0)

  useEffect(() => {
    if (isOpen) {
      if (packageData) {
        reset({
          name: packageData.name,
          diamondAmount: packageData.diamondAmount,
          bonusDiamond: packageData.bonusDiamond,
          price: packageData.price,
          description: packageData.description ?? '',
          status: packageData.status,
          orderIndex: packageData.orderIndex,
        })
      } else {
        reset({
          name: '',
          diamondAmount: 100,
          bonusDiamond: 0,
          price: 19000,
          description: '',
          status: 'ACTIVE',
          orderIndex: 0,
        })
      }
    }
  }, [isOpen, packageData, reset])

  if (!isOpen) return null

  const handleFormSubmit = async (values: DiamondPackageFormValues) => {
    await onSubmit(values)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="diamond-package-form-title"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border-2 border-slate-200 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <h3 id="diamond-package-form-title" className="text-xl font-extrabold text-slate-800">
            {isEdit ? 'CHỈNH SỬA GÓI KIM CƯƠNG' : 'THÊM GÓI KIM CƯƠNG MỚI'}
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
              Tên gói <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Túi Đá Quý, Rương Bạc..."
              {...register('name')}
              className={`w-full px-3.5 py-2.5 rounded-xl border-2 bg-slate-50 text-sm text-slate-800 font-medium focus:bg-white focus:outline-none transition-colors ${
                errors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'
              }`}
            />
            {errors.name && (
              <p className="text-rose-500 text-xs font-semibold mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Kim cương cơ bản <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                {...register('diamondAmount', { valueAsNumber: true })}
                className={`w-full px-3.5 py-2.5 rounded-xl border-2 bg-slate-50 text-sm text-slate-800 font-medium focus:bg-white focus:outline-none transition-colors ${
                  errors.diamondAmount ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'
                }`}
              />
              {errors.diamondAmount && (
                <p className="text-rose-500 text-xs font-semibold mt-1">{errors.diamondAmount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Kim cương thưởng (Bonus)
              </label>
              <input
                type="number"
                min="0"
                {...register('bonusDiamond', { valueAsNumber: true })}
                className={`w-full px-3.5 py-2.5 rounded-xl border-2 bg-slate-50 text-sm text-slate-800 font-medium focus:bg-white focus:outline-none transition-colors ${
                  errors.bonusDiamond ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'
                }`}
              />
              {errors.bonusDiamond && (
                <p className="text-rose-500 text-xs font-semibold mt-1">{errors.bonusDiamond.message}</p>
              )}
            </div>
          </div>

          <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 flex items-center justify-between text-xs text-sky-800 font-medium">
            <span>Tổng kim cương nhận được:</span>
            <strong className="text-sm font-extrabold text-sky-600">{totalDiamonds.toLocaleString('vi-VN')} 💎</strong>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Giá niêm yết (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="VD: 19000"
                {...register('price', { valueAsNumber: true })}
                className={`w-full px-3.5 py-2.5 rounded-xl border-2 bg-slate-50 text-sm text-slate-800 font-medium focus:bg-white focus:outline-none transition-colors ${
                  errors.price ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'
                }`}
              />
              {errors.price && (
                <p className="text-rose-500 text-xs font-semibold mt-1">{errors.price.message}</p>
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
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Trạng thái hiển thị <span className="text-rose-500">*</span>
            </label>
            <select
              {...register('status')}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-sm text-slate-800 font-medium focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
            >
              <option value="ACTIVE">HOẠT ĐỘNG (ACTIVE - hiển thị ở Shop)</option>
              <option value="INACTIVE">NGỪNG SỬ DỤNG (INACTIVE - ẩn khỏi Shop)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Mô tả gói
            </label>
            <textarea
              rows={2}
              placeholder="VD: Gói tiết kiệm phổ biến nhất cho người mới bắt đầu..."
              {...register('description')}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-sm text-slate-800 font-medium focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
            />
            {errors.description && (
              <p className="text-rose-500 text-xs font-semibold mt-1">{errors.description.message}</p>
            )}
          </div>

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
              {isLoading ? 'ĐANG LƯU...' : isEdit ? 'CẬP NHẬT' : 'THÊM GÓI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
