import { ApiError } from '../api/api-error'

const messages: Record<string, string> = {
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
  SECTION_NOT_FOUND: 'Không tìm thấy Section được yêu cầu.',
  TOPIC_NOT_FOUND: 'Không tìm thấy Topic được yêu cầu.',
  TOPIC_HAS_LESSONS: 'Không thể xóa Topic đang chứa Lesson. Hãy xóa hoặc xử lý các Lesson trước.',
  INVALID_TOPIC_ORDER: 'Thứ tự Topic không hợp lệ. Danh sách đã được khôi phục.',
  LESSON_NOT_FOUND: 'Không tìm thấy Lesson được yêu cầu.',
  QUESTION_NOT_FOUND: 'Không tìm thấy một hoặc nhiều câu hỏi được chọn.',
  QUESTION_TOPIC_MISMATCH: 'Câu hỏi liên kết với Topic khác nên không thể gán vào Lesson này.',
  QUESTION_ALREADY_ASSIGNED_TO_LESSON: 'Một hoặc nhiều câu hỏi đã thuộc Lesson này.',
  LESSON_NOT_READY_TO_PUBLISH: 'Lesson chưa đủ điều kiện xuất bản. Hãy kiểm tra tên, điểm yêu cầu và số câu hỏi.',
  INVALID_LESSON_ORDER: 'Thứ tự Lesson không hợp lệ. Danh sách đã được khôi phục.',
  VALIDATION_ERROR: 'Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại biểu mẫu.',
  INTERNAL_SERVER_ERROR: 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.',
  NETWORK_ERROR: 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra backend và kết nối mạng.',
}

export function getAdminContentError(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return error instanceof Error ? error.message : fallback
  return messages[error.code] ?? error.message ?? fallback
}

export function getDuplicateNameError(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null
  if (error.code === 'TOPIC_NAME_ALREADY_EXISTS') return 'Tên Topic đã tồn tại trong Section này.'
  if (error.code === 'LESSON_NAME_ALREADY_EXISTS') return 'Tên Lesson đã tồn tại trong Topic này.'
  return error.fieldErrors.find((item) => item.field === 'name')?.message ?? null
}
