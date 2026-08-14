import { normalizeApiError } from '../api/api-error'

export function getProfileErrorMessage(error: unknown): string {
  const apiError = normalizeApiError(error)

  switch (apiError.code) {
    case 'USER_NOT_FOUND':
      return 'Không tìm thấy tài khoản của bạn.'
    case 'NETWORK_ERROR':
      return 'Không thể kết nối tới máy chủ. Vui lòng thử lại.'
    case 'INTERNAL_SERVER_ERROR':
      return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
    default:
      return apiError.message || 'Không thể tải thông tin cá nhân. Vui lòng thử lại.'
  }
}

export function getUpdateNameErrorMessage(error: unknown): string {
  const apiError = normalizeApiError(error)

  switch (apiError.code) {
    case 'USER_NOT_FOUND':
      return 'Không tìm thấy tài khoản để cập nhật.'
    case 'NETWORK_ERROR':
      return 'Không thể kết nối tới máy chủ. Vui lòng thử lại.'
    case 'INTERNAL_SERVER_ERROR':
      return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
    default:
      return apiError.message || 'Không thể cập nhật tên hiển thị. Vui lòng thử lại.'
  }
}

export function getChangePasswordErrorMessage(error: unknown): string {
  const apiError = normalizeApiError(error)

  switch (apiError.code) {
    case 'USER_NOT_FOUND':
      return 'Không tìm thấy tài khoản để đổi mật khẩu.'
    case 'PASSWORD_CHANGE_NOT_AVAILABLE':
      return 'Tài khoản này không hỗ trợ đổi mật khẩu tại đây.'
    case 'NETWORK_ERROR':
      return 'Không thể kết nối tới máy chủ. Vui lòng thử lại.'
    case 'INTERNAL_SERVER_ERROR':
      return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
    default:
      return apiError.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.'
  }
}
