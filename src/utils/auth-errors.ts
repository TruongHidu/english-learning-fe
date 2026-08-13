import { normalizeApiError } from '../api/api-error'

export function getLoginErrorMessage(error: unknown): string {
  const apiError = normalizeApiError(error)

  switch (apiError.code) {
    case 'INVALID_CREDENTIALS':
      return 'Email hoặc mật khẩu không chính xác.'
    case 'ACCOUNT_LOCKED':
      return 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.'
    case 'ACCOUNT_BANNED':
      return 'Tài khoản của bạn đã bị cấm. Vui lòng liên hệ hỗ trợ.'
    case 'GOOGLE_AUTH_REQUIRED':
      return 'Tài khoản này cần đăng nhập bằng Google.'
    case 'NETWORK_ERROR':
      return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối và thử lại.'
    case 'INTERNAL_SERVER_ERROR':
      return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
    default:
      return apiError.message || 'Không thể đăng nhập. Vui lòng thử lại.'
  }
}

export function getRegisterErrorMessage(error: unknown): string {
  const apiError = normalizeApiError(error)

  switch (apiError.code) {
    case 'NETWORK_ERROR':
      return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối và thử lại.'
    case 'INTERNAL_SERVER_ERROR':
      return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
    default:
      return apiError.message || 'Không thể tạo tài khoản. Vui lòng thử lại.'
  }
}
