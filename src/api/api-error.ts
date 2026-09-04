import axios from 'axios'
import type { ApiErrorResponse, ApiFieldError } from '../types/auth.types'

export class ApiError extends Error {
  readonly code: string
  readonly status: number | null
  readonly fieldErrors: ApiFieldError[]
  readonly isNetworkError: boolean

  constructor(options: {
    message: string
    code: string
    status?: number
    fieldErrors?: ApiFieldError[]
    isNetworkError?: boolean
  }) {
    super(options.message)
    this.name = 'ApiError'
    this.code = options.code
    this.status = options.status ?? null
    this.fieldErrors = options.fieldErrors ?? []
    this.isNetworkError = options.isNetworkError ?? false
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseFieldErrors(value: unknown): ApiFieldError[] {
  if (!Array.isArray(value)) return []

  return value.filter(
    (item): item is ApiFieldError =>
      isRecord(item) && typeof item.field === 'string' && typeof item.message === 'string',
  )
}

function parseErrorResponse(value: unknown): ApiErrorResponse | null {
  if (
    !isRecord(value) ||
    value.success !== false ||
    typeof value.message !== 'string' ||
    typeof value.code !== 'string'
  ) {
    return null
  }

  return {
    success: false,
    message: value.message,
    code: value.code,
    errors: parseFieldErrors(value.errors),
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (axios.isAxiosError(error)) {
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      return new ApiError({
        code: 'REQUEST_CANCELED',
        message: 'Yêu cầu đã được hủy.',
      })
    }
    if (!error.response) {
      return new ApiError({
        code: 'NETWORK_ERROR',
        message: 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối và thử lại.',
        isNetworkError: true,
      })
    }

    const responseError = parseErrorResponse(error.response.data)
    if (responseError) {
      return new ApiError({
        code: responseError.code,
        message: responseError.message,
        status: error.response.status,
        fieldErrors: responseError.errors,
      })
    }

    return new ApiError({
      code: error.response.status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_FAILED',
      message:
        error.response.status >= 500
          ? 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
          : 'Yêu cầu không thành công. Vui lòng thử lại.',
      status: error.response.status,
    })
  }

  return new ApiError({
    code: 'UNKNOWN_ERROR',
    message: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.',
  })
}
