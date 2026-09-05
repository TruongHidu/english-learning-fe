import type { ApiError } from '../api/api-error'

export function getShopErrorMessage(error: unknown, fallback = 'Không thể tải cửa hàng. Vui lòng thử lại.') {
  const apiError = error as Partial<ApiError> | undefined
  if (apiError?.code === 'INSUFFICIENT_DIAMOND') return 'Bạn không đủ kim cương để mua tim.'
  if (apiError?.code === 'HEART_ALREADY_FULL') return 'Bạn đã có đầy đủ tim.'
  if (apiError?.code === 'SHOP_PURCHASE_CONFLICT') return 'Số dư đã thay đổi. Vui lòng thử lại.'
  if (apiError?.code === 'ACCOUNT_NOT_ACTIVE') return 'Tài khoản hiện không thể sử dụng cửa hàng.'
  return apiError?.message || fallback
}
