import { ApiError } from '../api/api-error'

const aiVocabularyMessages: Record<string, string> = {
  AI_GENERATION_NOT_FOUND:
    'Danh sách đề xuất không còn tồn tại hoặc bạn không có quyền truy cập. Hãy tạo lại.',
  AI_GENERATION_NOT_COMMITTABLE:
    'Danh sách đề xuất đã hết hiệu lực hoặc đã được lưu trước đó.',
  AI_GENERATION_STATE_CONFLICT:
    'Danh sách đề xuất đang được xử lý hoặc đã được lưu. Vui lòng tải lại danh sách DRAFT.',
  AI_CANDIDATE_NOT_FOUND:
    'Có đề xuất không còn thuộc lần tạo AI này. Hãy tạo lại danh sách.',
  AI_GENERATION_DATA_INVALID:
    'Dữ liệu đề xuất AI không hợp lệ. Hãy tạo lại danh sách.',
  VOCABULARY_ALREADY_EXISTS:
    'Một hoặc nhiều từ đã tồn tại trong chủ đề. Hãy sửa hoặc bỏ chọn các từ bị trùng.',
  DUPLICATE_VOCABULARIES:
    'Danh sách đang chọn có từ bị trùng. Hãy kiểm tra lại.',
  VALIDATION_ERROR:
    'Một hoặc nhiều đề xuất chưa hợp lệ. Vui lòng kiểm tra lỗi tại từng dòng.',
  AI_PROVIDER_TIMEOUT:
    'AI phản hồi quá thời gian. Vui lòng thử lại sau.',
  AI_PROVIDER_NOT_CONFIGURED:
    'AI chưa được cấu hình trên máy chủ. Vui lòng liên hệ quản trị hệ thống.',
  REQUEST_CANCELED: 'Yêu cầu đã được hủy.',
  NETWORK_ERROR:
    'Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.',
}

const aiQuestionMessages: Record<string, string> = {
  ...aiVocabularyMessages,
  AI_QUESTION_TYPE_NOT_SUPPORTED:
    'AI hiện chỉ hỗ trợ Trắc nghiệm, Ghép cặp, Điền từ và Sắp xếp câu.',
  AI_VOCABULARY_REFERENCE_INVALID:
    'Một đề xuất đang tham chiếu từ vựng ngoài phạm vi đã chọn. Hãy tạo lại danh sách.',
  QUESTION_ALREADY_EXISTS:
    'Một hoặc nhiều câu hỏi đã tồn tại trong chủ đề. Hãy sửa nội dung hoặc bỏ chọn.',
  DUPLICATE_QUESTIONS:
    'Danh sách đang chọn có câu hỏi trùng nhau. Hãy kiểm tra lại.',
  AI_QUESTION_COMMIT_FAILED:
    'Không thể lưu Question DRAFT. Giao dịch đã được hoàn tác.',
  AI_GENERATION_CANCELED: 'Yêu cầu tạo câu hỏi AI đã được hủy.',
}

export function isRequestCanceled(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'REQUEST_CANCELED'
}

export function getAiVocabularyError(
  error: unknown,
  fallback: string,
): string {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : fallback
  }
  return aiVocabularyMessages[error.code] ?? error.message ?? fallback
}

export function getAiQuestionError(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : fallback
  }
  return aiQuestionMessages[error.code] ?? error.message ?? fallback
}
