import { normalizeApiError } from '../api/api-error'

export function getStartLessonErrorMessage(error: unknown): string {
  const apiError = normalizeApiError(error)

  switch (apiError.code) {
    case 'SECTION_LOCKED':
      return 'Bạn cần hoàn thành tất cả bài học trong phần học trước.'
    case 'LESSON_LOCKED':
      return 'Bạn cần hoàn thành bài học trước để mở bài học này.'
    case 'INSUFFICIENT_HEART':
      return 'Bạn đã hết tim. Hãy chờ hồi tim hoặc mua thêm tim.'
    case 'LESSON_HAS_NO_PUBLISHED_QUESTIONS':
      return 'Bài học hiện chưa có câu hỏi để bắt đầu.'
    case 'LESSON_NOT_FOUND':
    case 'LESSON_NOT_PUBLISHED':
      return 'Không tìm thấy bài học.'
    case 'NETWORK_ERROR':
      return 'Không thể kết nối tới máy chủ. Vui lòng thử lại.'
    default:
      return 'Không thể bắt đầu bài học. Vui lòng thử lại.'
  }
}

export function getLearningPathErrorMessage(error: unknown): string {
  const apiError = normalizeApiError(error)

  switch (apiError.code) {
    case 'SECTION_LOCKED':
      return 'Bạn cần hoàn thành tất cả bài học trong phần học trước.'
    case 'LESSON_LOCKED':
      return 'Bạn cần hoàn thành bài học trước để mở bài học này.'
    case 'SECTION_NOT_FOUND':
      return 'Không tìm thấy phần học.'
    case 'TOPIC_NOT_FOUND':
      return 'Không tìm thấy chủ đề.'
    case 'NETWORK_ERROR':
      return 'Không thể kết nối máy chủ. Vui lòng thử lại.'
    default:
      return 'Không thể tải lộ trình học. Vui lòng thử lại.'
  }
}
