import { useCallback, useEffect, useState } from 'react'
import ConfirmModal from '../../components/admin/ConfirmModal'
import DataTable from '../../components/admin/DataTable'
import EmptyState from '../../components/admin/EmptyState'
import ErrorState from '../../components/admin/ErrorState'
import LoadingState from '../../components/admin/LoadingState'
import PageHeader from '../../components/admin/PageHeader'
import QuestionFormModal from '../../components/admin/QuestionFormModal'
import QuestionPreviewModal from '../../components/admin/QuestionPreviewModal'
import SearchInput from '../../components/admin/SearchInput'
import StatusBadge from '../../components/admin/StatusBadge'
import { adminQuestionService } from '../../services/admin-question.service'
import type {
  CreateQuestionInput,
  QuestionListItemResponse,
  QuestionResponse,
  QuestionStatus,
  QuestionType,
} from '../../types/question.types'
import type { VocabularyDifficulty } from '../../types/vocabulary.types'
import { getAdminContentError } from '../../utils/admin-content-errors'

export default function AdminQuestionListPage() {
  const [questions, setQuestions] = useState<QuestionListItemResponse[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<QuestionType | ''>('')
  const [difficultyFilter, setDifficultyFilter] = useState<
    VocabularyDifficulty | ''
  >('')
  const [statusFilter, setStatusFilter] = useState<QuestionStatus | ''>('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedQuestion, setSelectedQuestion] =
    useState<QuestionResponse | null>(null)
  const [previewQuestion, setPreviewQuestion] =
    useState<QuestionResponse | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [questionToDelete, setQuestionToDelete] =
    useState<QuestionListItemResponse | null>(null)
  const [isMutating, setIsMutating] = useState(false)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    window.setTimeout(() => setNotification(null), 4500)
  }

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await adminQuestionService.getQuestions({
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        type: typeFilter || undefined,
        difficulty: difficultyFilter || undefined,
        status: statusFilter || undefined,
      })
      setQuestions(res.questions)
      setPagination((prev) => ({
        ...prev,
        total: res.total,
        totalPages: Math.ceil(res.total / prev.limit),
      }))

    } catch (err: unknown) {
      setError(getAdminContentError(err, 'Không thể tải danh sách câu hỏi.'))
    } finally {
      setIsLoading(false)
    }
  }, [
    pagination.page,
    pagination.limit,
    search,
    typeFilter,
    difficultyFilter,
    statusFilter,
  ])

  useEffect(() => {
    void fetchQuestions()
  }, [fetchQuestions])

  const openCreate = () => {
    setSelectedQuestion(null)
    setServerError(null)
    setIsFormOpen(true)
  }

  const openEdit = async (item: QuestionListItemResponse) => {
    setIsMutating(true)
    try {
      const fullQuestion = await adminQuestionService.getQuestionById(item.id)
      setSelectedQuestion(fullQuestion)
      setServerError(null)
      setIsFormOpen(true)
    } catch (err: unknown) {
      showNotification(
        'error',
        getAdminContentError(err, 'Không thể lấy chi tiết câu hỏi.'),
      )
    } finally {
      setIsMutating(false)
    }
  }

  const openPreview = async (item: QuestionListItemResponse) => {
    setIsMutating(true)
    try {
      const fullQuestion = await adminQuestionService.getQuestionById(item.id)
      setPreviewQuestion(fullQuestion)
      setIsPreviewOpen(true)
    } catch (err: unknown) {
      showNotification(
        'error',
        getAdminContentError(err, 'Không thể lấy chi tiết câu hỏi để xem trước.'),
      )
    } finally {
      setIsMutating(false)
    }
  }

  const handleSubmit = async (values: CreateQuestionInput) => {
    setIsSubmitting(true)
    setServerError(null)
    try {
      if (selectedQuestion) {
        await adminQuestionService.updateQuestion(selectedQuestion.id, values)
        showNotification('success', 'Đã cập nhật câu hỏi.')
      } else {
        await adminQuestionService.createQuestion(values)
        showNotification('success', 'Đã tạo câu hỏi mới.')
      }
      setIsFormOpen(false)
      setSelectedQuestion(null)
      void fetchQuestions()
    } catch (err: unknown) {
      setServerError(getAdminContentError(err, 'Không thể lưu câu hỏi.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (
    item: QuestionListItemResponse,
    status: QuestionStatus,
  ) => {
    setIsMutating(true)
    try {
      await adminQuestionService.updateQuestionStatus(item.id, status)
      showNotification('success', 'Đã đổi trạng thái câu hỏi.')
      void fetchQuestions()
    } catch (err: unknown) {
      showNotification(
        'error',
        getAdminContentError(err, 'Không thể đổi trạng thái câu hỏi.'),
      )
    } finally {
      setIsMutating(false)
    }
  }

  const handleDelete = async () => {
    if (!questionToDelete) return
    setIsMutating(true)
    try {
      await adminQuestionService.deleteQuestion(questionToDelete.id)
      showNotification('success', 'Đã xóa câu hỏi.')
      setQuestionToDelete(null)
      void fetchQuestions()
    } catch (err: unknown) {
      showNotification(
        'error',
        getAdminContentError(err, 'Không thể xóa câu hỏi.'),
      )
      setQuestionToDelete(null)
    } finally {
      setIsMutating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="admin-page">
        <LoadingState label="Đang tải Ngân hàng câu hỏi..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-page">
        <ErrorState
          title="Không thể tải câu hỏi"
          message={error}
          onRetry={() => void fetchQuestions()}
        />
      </div>
    )
  }

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Quản lý học tập"
        title="Ngân hàng câu hỏi"
        description="Quản lý toàn bộ câu hỏi thực hành của hệ thống."
        action={
          <button
            type="button"
            className="admin-button admin-button--primary"
            onClick={openCreate}
          >
            + Tạo câu hỏi
          </button>
        }
      />

      {notification ? (
        <div
          className={`admin-notification admin-notification--${notification.type}`}
          role="status"
        >
          <span>{notification.message}</span>
          <button type="button" onClick={() => setNotification(null)}>
            ×
          </button>
        </div>
      ) : null}

      <div className="admin-filter-bar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tìm nội dung câu hỏi..."
        />
        <select
          className="admin-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as QuestionType | '')}
        >
          <option value="">Tất cả loại câu hỏi</option>
          <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
          <option value="MATCHING">Ghép từ</option>
          <option value="FILL_BLANK">Điền từ</option>
          <option value="TRANSLATION">Dịch câu</option>
          <option value="ORDER_SENTENCE">Sắp xếp từ</option>
          <option value="LISTENING">Bài nghe</option>
        </select>
        <select
          className="admin-select"
          value={difficultyFilter}
          onChange={(e) =>
            setDifficultyFilter(e.target.value as VocabularyDifficulty | '')
          }
        >
          <option value="">Tất cả độ khó</option>
          <option value="EASY">Dễ</option>
          <option value="MEDIUM">Vừa</option>
          <option value="HARD">Khó</option>
        </select>
        <select
          className="admin-select"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as QuestionStatus | '')
          }
        >
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">Bản nháp</option>
          <option value="PUBLISHED">Xuất bản</option>
          <option value="INACTIVE">Ngừng dùng</option>
        </select>
      </div>

      {questions.length === 0 ? (
        <EmptyState
          title="Ngân hàng câu hỏi trống"
          description="Chưa có câu hỏi nào khớp với bộ lọc."
          action={
            <button
              type="button"
              className="admin-button admin-button--primary"
              onClick={openCreate}
            >
              + Tạo câu hỏi
            </button>
          }
        />
      ) : (
        <DataTable
          headers={[
            'Câu hỏi',
            'Từ vựng liên kết',
            'Loại',
            'Độ khó',
            'Trạng thái',
            'Thao tác',
          ]}
          caption="Danh sách câu hỏi"
        >
          {questions.map((q) => (
            <tr key={q.id}>
              <td className="admin-table__primary">
                <strong>{q.content}</strong>
              </td>
              <td>
                {q.vocabularies && q.vocabularies.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {q.vocabularies.map((v) => (
                      <span
                        key={v.id}
                        className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg"
                      >
                        🔤 {v.word}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs font-semibold">— (Tổng hợp)</span>
                )}
              </td>

              <td>
                <span className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded">
                  {q.type}
                </span>
              </td>
              <td>
                <span className="font-bold text-xs">
                  {q.difficulty === 'EASY'
                    ? 'Dễ'
                    : q.difficulty === 'MEDIUM'
                      ? 'Vừa'
                      : 'Khó'}
                </span>
              </td>
              <td>
                <StatusBadge status={q.status} />
              </td>
              <td>
                <span className="admin-actions">
                  <button
                    type="button"
                    className="admin-button admin-button--secondary admin-button--small"
                    onClick={() => void openPreview(q)}
                  >
                    👀 Xem trước
                  </button>
                  <button
                    type="button"
                    className="admin-button admin-button--secondary admin-button--small"
                    onClick={() => void openEdit(q)}
                  >
                    Chỉnh sửa
                  </button>
                  <select
                    className="admin-select admin-select--small"
                    value={q.status}
                    disabled={isMutating}
                    onChange={(e) =>
                      void handleStatusChange(
                        q,
                        e.target.value as QuestionStatus,
                      )
                    }
                  >
                    <option value="DRAFT">Bản nháp</option>
                    <option value="PUBLISHED">Xuất bản</option>
                    <option value="INACTIVE">Ngừng dùng</option>
                  </select>
                  <button
                    type="button"
                    className="admin-button admin-button--danger admin-button--small"
                    onClick={() => setQuestionToDelete(q)}
                  >
                    Xóa
                  </button>
                </span>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <QuestionPreviewModal
        isOpen={isPreviewOpen}
        question={previewQuestion}
        onClose={() => setIsPreviewOpen(false)}
      />

      <QuestionFormModal
        isOpen={isFormOpen}
        question={selectedQuestion}
        isLoading={isSubmitting}
        serverError={serverError}
        onSubmit={handleSubmit}
        onClose={() => {
          if (!isSubmitting) {
            setIsFormOpen(false)
            setSelectedQuestion(null)
            setServerError(null)
          }
        }}
      />

      <ConfirmModal
        isOpen={Boolean(questionToDelete)}
        title="Xóa câu hỏi"
        message={`Xóa vĩnh viễn câu hỏi “${questionToDelete?.content ?? ''}”?`}
        confirmLabel="Xóa câu hỏi"
        confirmVariant="danger"
        isLoading={isMutating}
        onConfirm={() => void handleDelete()}
        onClose={() => setQuestionToDelete(null)}
      />
    </div>
  )
}
