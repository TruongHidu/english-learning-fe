import { ApiError } from '../api/api-error'
import type { QuestionMediaFieldErrors } from '../types/question.types'

export const IMAGE_MAX_SIZE = 5 * 1024 * 1024
export const AUDIO_MAX_SIZE = 20 * 1024 * 1024

export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
export const AUDIO_ACCEPT =
  'audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/mp4,audio/webm'

const IMAGE_TYPES = new Set(IMAGE_ACCEPT.split(','))
const AUDIO_TYPES = new Set(AUDIO_ACCEPT.split(','))

export interface BuildQuestionFormDataOptions<TPayload extends object> {
  payload: TPayload
  imageFile?: File | null
  audioFile?: File | null
  removeImage?: boolean
  removeAudio?: boolean
}

export interface QuestionUploadErrors extends QuestionMediaFieldErrors {
  general?: string
}

export function validateQuestionImage(file: File): string | null {
  if (!IMAGE_TYPES.has(file.type)) {
    return 'Ảnh phải có định dạng JPEG, PNG, WebP hoặc GIF'
  }
  if (file.size > IMAGE_MAX_SIZE) {
    return 'Ảnh không được vượt quá 5 MB'
  }
  return null
}

export function validateQuestionAudio(file: File): string | null {
  if (!AUDIO_TYPES.has(file.type)) {
    return 'Âm thanh phải có định dạng MP3, WAV, OGG, MP4 hoặc WebM'
  }
  if (file.size > AUDIO_MAX_SIZE) {
    return 'Âm thanh không được vượt quá 20 MB'
  }
  return null
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kilobytes = bytes / 1024
  if (kilobytes < 1024) return `${kilobytes.toFixed(1)} KB`
  return `${(kilobytes / 1024).toFixed(1)} MB`
}

export function buildQuestionFormData<TPayload extends object>(
  options: BuildQuestionFormDataOptions<TPayload>,
): FormData {
  const payload = { ...options.payload } as Record<string, unknown>

  if (options.imageFile) {
    delete payload.imageUrl
  } else if (options.removeImage) {
    payload.imageUrl = null
  } else {
    delete payload.imageUrl
  }

  if (options.audioFile) {
    delete payload.audioUrl
  } else if (options.removeAudio) {
    payload.audioUrl = null
  } else {
    delete payload.audioUrl
  }

  const formData = new FormData()
  formData.append('payload', JSON.stringify(payload))

  if (options.imageFile) formData.append('image', options.imageFile)
  if (options.audioFile) formData.append('audio', options.audioFile)

  return formData
}

const uploadMessages: Record<string, string> = {
  INVALID_MEDIA_TYPE: 'Định dạng ảnh hoặc âm thanh không được hỗ trợ',
  INVALID_MEDIA_UPLOAD: 'File tải lên không hợp lệ',
  INVALID_MULTIPART_PAYLOAD: 'Dữ liệu câu hỏi gửi lên không hợp lệ',
  MEDIA_UPLOAD_FAILED:
    'Không thể tải file lên hệ thống lưu trữ. Vui lòng thử lại',
}

export function getQuestionUploadErrors(
  error: unknown,
  fallback: string,
): QuestionUploadErrors {
  if (!(error instanceof ApiError)) {
    return {
      general: error instanceof Error ? error.message : fallback,
    }
  }

  if (error.code === 'IMAGE_TOO_LARGE') {
    return { image: 'Ảnh không được vượt quá 5 MB' }
  }
  if (error.code === 'AUDIO_TOO_LARGE') {
    return { audio: 'Âm thanh không được vượt quá 20 MB' }
  }

  const imageError = error.fieldErrors.find((item) =>
    ['image', 'imageFile', 'imageUrl'].includes(item.field),
  )?.message
  const audioError = error.fieldErrors.find((item) =>
    ['audio', 'audioFile', 'audioUrl'].includes(item.field),
  )?.message
  const firstGeneralFieldError = error.fieldErrors.find(
    (item) =>
      !['image', 'imageFile', 'imageUrl', 'audio', 'audioFile', 'audioUrl'].includes(
        item.field,
      ),
  )?.message

  return {
    image: imageError,
    audio: audioError,
    general:
      uploadMessages[error.code] ??
      firstGeneralFieldError ??
      (!imageError && !audioError ? error.message || fallback : undefined),
  }
}
