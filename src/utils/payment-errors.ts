import type { ApiError } from '../api/api-error'

export function getPaymentErrorMessage(
  error: unknown,
  fallback = 'Không thể xử lý thanh toán. Vui lòng thử lại.',
): string {
  const apiError = error as Partial<ApiError> | undefined

  if (apiError?.status === 404) {
    return 'Không tìm thấy giao dịch hoặc giao dịch không thuộc tài khoản của bạn.'
  }
  if (apiError?.code === 'DIAMOND_PACKAGE_NOT_FOUND') {
    return 'Gói kim cương không còn được mở bán. Vui lòng tải lại cửa hàng.'
  }
  if (apiError?.isNetworkError) {
    return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.'
  }

  return apiError?.message || fallback
}

export function isPaymentNotFoundError(error: unknown): boolean {
  return (error as Partial<ApiError> | undefined)?.status === 404
}
