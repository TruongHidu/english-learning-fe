import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ConfirmModal from '../../components/admin/ConfirmModal'
import DataTable from '../../components/admin/DataTable'
import EmptyState from '../../components/admin/EmptyState'
import ErrorState from '../../components/admin/ErrorState'
import LessonFormModal from '../../components/admin/LessonFormModal'
import LoadingState from '../../components/admin/LoadingState'
import PageHeader from '../../components/admin/PageHeader'
import QuestionFormModal from '../../components/admin/QuestionFormModal'
import StatusBadge from '../../components/admin/StatusBadge'
import type { LessonFormValues } from '../../schemas/lesson.schema'
import { adminLessonService } from '../../services/admin-lesson.service'
import { adminQuestionService } from '../../services/admin-question.service'
import { adminVocabularyService } from '../../services/admin-vocabulary.service'
import type { ContentStatus } from '../../types/course.types'
import type { LessonResponse } from '../../types/lesson.types'
import type {
  LessonQuestionResponse,
  QuestionFormSubmission,
  QuestionResponse,
  QuestionListItemResponse,
  QuestionMediaFieldErrors,
  QuestionType,
} from '../../types/question.types'
import type { VocabularyDifficulty, VocabularyResponse } from '../../types/vocabulary.types'
import {
  getAdminContentError,
  getDuplicateNameError,
} from '../../utils/admin-content-errors'

import { vietnameseIncludes } from '../../utils/vietnamese'
import QuestionPreviewModal from '../../components/admin/QuestionPreviewModal'
import {
  buildQuestionFormData,
  getQuestionUploadErrors,
} from '../../utils/question-media'

export default function AdminLessonDetailPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState<LessonResponse | null>(null)
  const [lessonQuestions, setLessonQuestions] = useState<
    LessonQuestionResponse[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverNameError, setServerNameError] = useState<string | null>(null)
  const [pendingStatus, setPendingStatus] = useState<ContentStatus | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isMutating, setIsMutating] = useState(false)

  const [previewQuestion, setPreviewQuestion] = useState<QuestionResponse | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const [isCreateQuestionModalOpen, setIsCreateQuestionModalOpen] =
    useState(false)
  const [createQuestionError, setCreateQuestionError] = useState<
    string | null
  >(null)
  const [createQuestionMediaErrors, setCreateQuestionMediaErrors] =
    useState<QuestionMediaFieldErrors>({})
  const [questionUploadProgress, setQuestionUploadProgress] = useState<
    number | null
  >(null)


  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)

  const [availableQuestions, setAvailableQuestions] = useState<
    QuestionListItemResponse[]
  >([])
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([])
  const [assignSearch, setAssignSearch] = useState('')
  const [assignTypeFilter, setAssignTypeFilter] = useState<QuestionType | ''>(
    '',
  )
  const [assignDifficultyFilter, setAssignDifficultyFilter] = useState<
    VocabularyDifficulty | ''
  >('')
  const [questionToRemove, setQuestionToRemove] =
    useState<LessonQuestionResponse | null>(null)

  const [topicVocabularies, setTopicVocabularies] = useState<VocabularyResponse[]>([])

  const loadData = useCallback(async () => {
    if (!lessonId) {
      setError('Thiếu mã Lesson.')
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const [lessonData, questionsData] = await Promise.all([
        adminLessonService.getLessonById(lessonId),
        adminQuestionService.getLessonQuestions(lessonId),
      ])
      setLesson(lessonData)
      setLessonQuestions(questionsData)

      if (lessonData.topicId) {
        try {
          const vocabRes = await adminVocabularyService.getVocabulariesByTopic(
            lessonData.topicId,
            { limit: 100 },
          )
          setTopicVocabularies(vocabRes.vocabularies)
        } catch {
          // Silent ignore if topic vocabularies load failed
        }
      }
    } catch (err: unknown) {
      setError(getAdminContentError(err, 'Không thể tải Lesson.'))
    } finally {
      setIsLoading(false)
    }
  }, [lessonId])


  useEffect(() => {
    void loadData()
  }, [loadData])

  const filteredAvailableQuestions = useMemo(() => {
    return availableQuestions.filter((q) => {
      const matchSearch =
        !assignSearch || vietnameseIncludes(q.content, assignSearch)
      const matchType = !assignTypeFilter || q.type === assignTypeFilter
      const matchDiff =
        !assignDifficultyFilter || q.difficulty === assignDifficultyFilter
      return matchSearch && matchType && matchDiff
    })
  }, [
    availableQuestions,
    assignSearch,
    assignTypeFilter,
    assignDifficultyFilter,
  ])


  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    window.setTimeout(() => setNotification(null), 4500)
  }

  const handleSubmit = async (values: LessonFormValues) => {
    if (!lesson) return
    setIsSubmitting(true)
    setServerNameError(null)
    try {
      const updated = await adminLessonService.updateLesson(lesson.id, {
        name: values.name,
        description: values.description,
        requiredScore: values.requiredScore,
        questionCount: values.questionCount,
        xpReward: values.xpReward,
        diamondReward: values.diamondReward,
      })
      setLesson(updated)
      setIsFormOpen(false)
      showNotification('success', 'Đã cập nhật Lesson.')
    } catch (err: unknown) {
      const duplicate = getDuplicateNameError(err)
      if (duplicate) setServerNameError(duplicate)
      else
        showNotification(
          'error',
          getAdminContentError(err, 'Không thể cập nhật Lesson.'),
        )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatus = async () => {
    if (!lesson || !pendingStatus) return
    setIsMutating(true)
    try {
      setLesson(
        await adminLessonService.updateLessonStatus(lesson.id, pendingStatus),
      )
      setPendingStatus(null)
      showNotification('success', 'Đã cập nhật trạng thái Lesson.')
    } catch (err: unknown) {
      setPendingStatus(null)
      showNotification(
        'error',
        getAdminContentError(err, 'Không thể đổi trạng thái Lesson.'),
      )
    } finally {
      setIsMutating(false)
    }
  }

  const handleDelete = async () => {
    if (!lesson) return
    setIsMutating(true)
    try {
      await adminLessonService.deleteLesson(lesson.id)
      navigate(`/admin/topics/${lesson.topicId}/lessons`, { replace: true })
    } catch (err: unknown) {
      setDeleteOpen(false)
      showNotification(
        'error',
        getAdminContentError(err, 'Không thể xóa Lesson.'),
      )
    } finally {
      setIsMutating(false)
    }
  }

  const openCreateQuestionModal = () => {
    setCreateQuestionError(null)
    setCreateQuestionMediaErrors({})
    setQuestionUploadProgress(null)
    setIsCreateQuestionModalOpen(true)
  }

  const handleCreateQuestionSubmit = async (values: QuestionFormSubmission) => {
    if (!lessonId) return
    setIsSubmitting(true)
    setCreateQuestionError(null)
    setCreateQuestionMediaErrors({})
    setQuestionUploadProgress(0)
    try {
      const createdQuestion = await adminQuestionService.createQuestion(
        buildQuestionFormData(values),
        setQuestionUploadProgress,
      )
      const updatedList = await adminQuestionService.assignQuestionsToLesson(
        lessonId,
        [createdQuestion.id],
      )
      setLessonQuestions(updatedList)
      setLesson((prev) =>
        prev ? { ...prev, questionCount: updatedList.length } : prev,
      )
      showNotification('success', 'Đã tạo và gán câu hỏi mới vào bài học.')
      setIsCreateQuestionModalOpen(false)
    } catch (err: unknown) {
      const uploadErrors = getQuestionUploadErrors(
        err,
        'Không thể tạo và gán câu hỏi.',
      )
      setCreateQuestionError(uploadErrors.general ?? null)
      setCreateQuestionMediaErrors({
        image: uploadErrors.image,
        audio: uploadErrors.audio,
      })
    } finally {
      setIsSubmitting(false)
      setQuestionUploadProgress(null)
    }
  }

  const openAssignModal = async () => {
    setIsMutating(true)
    try {
      const res = await adminQuestionService.getQuestions({ limit: 100 })
      const assignedIds = new Set(lessonQuestions.map((lq) => lq.questionId))
      const unassigned = res.questions.filter((q) => !assignedIds.has(q.id))
      setAvailableQuestions(unassigned)
      setSelectedQuestionIds([])
      setAssignSearch('')
      setAssignTypeFilter('')
      setAssignDifficultyFilter('')
      setIsAssignModalOpen(true)
    } catch (err: unknown) {
      showNotification(
        'error',
        getAdminContentError(err, 'Không thể lấy ngân hàng câu hỏi.'),
      )
    } finally {
      setIsMutating(false)
    }

  }

  const handleAssignQuestion = async () => {
    if (!lessonId || selectedQuestionIds.length === 0) return
    setIsSubmitting(true)
    try {
      const updatedList = await adminQuestionService.assignQuestionsToLesson(
        lessonId,
        selectedQuestionIds,
      )
      setLessonQuestions(updatedList)
      setLesson((prev) =>
        prev ? { ...prev, questionCount: updatedList.length } : prev,
      )
      showNotification(
        'success',
        `Đã gán ${selectedQuestionIds.length} câu hỏi vào bài học.`,
      )
      setIsAssignModalOpen(false)
    } catch (err: unknown) {
      showNotification(
        'error',
        getAdminContentError(err, 'Không thể gán câu hỏi.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveQuestion = async () => {
    if (!lessonId || !questionToRemove) return
    const targetQId = questionToRemove.questionId || questionToRemove.question?.id
    const targetLqId = questionToRemove.id

    setIsMutating(true)
    try {
      await adminQuestionService.removeQuestionFromLesson(
        lessonId,
        targetQId,
      )

      setLessonQuestions((prev) =>
        prev.filter(
          (lq) =>
            lq.id !== targetLqId &&
            lq.questionId !== targetQId &&
            lq.question?.id !== targetQId,
        ),
      )

      setLesson((prev) =>
        prev
          ? {
              ...prev,
              questionCount: Math.max(0, prev.questionCount - 1),
            }
          : prev,
      )

      showNotification('success', 'Đã gỡ câu hỏi khỏi bài học.')
    } catch (err: unknown) {
      showNotification(
        'error',
        getAdminContentError(err, 'Không thể gỡ câu hỏi.'),
      )
    } finally {
      setQuestionToRemove(null)
      setIsMutating(false)
    }
  }




  if (isLoading)
    return (
      <div className="admin-page">
        <LoadingState label="Đang tải Lesson..." />
      </div>
    )
  if (error || !lesson)
    return (
      <div className="admin-page">
        <ErrorState
          title="Không thể tải Lesson"
          message={error || 'Không tìm thấy Lesson.'}
          onRetry={() => void loadData()}
        />
      </div>
    )

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Nội dung học / Lesson"
        title={lesson.name}
        description={lesson.description || 'Lesson chưa có mô tả.'}
        action={
          <span className="admin-actions">
            <StatusBadge status={lesson.status} size="md" />
            <button
              type="button"
              className="admin-button admin-button--secondary"
              onClick={() => {
                setServerNameError(null)
                setIsFormOpen(true)
              }}
            >
              Sửa
            </button>
            <select
              className="admin-select"
              value={lesson.status}
              onChange={(event) =>
                setPendingStatus(event.target.value as ContentStatus)
              }
              aria-label="Đổi trạng thái Lesson"
            >
              <option value="DRAFT">Bản nháp</option>
              <option value="PUBLISHED">Xuất bản</option>
              <option value="INACTIVE">Ngừng dùng</option>
            </select>
            <button
              type="button"
              className="admin-button admin-button--danger"
              onClick={() => setDeleteOpen(true)}
            >
              Xóa
            </button>
          </span>
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

      <section className="admin-card">
        <div className="admin-card__header">
          <div>
            <h2>Thông tin chi tiết</h2>
            <p>Dữ liệu thật từ Lesson API.</p>
          </div>
        </div>
        <dl className="admin-detail-list">
          <div>
            <dt>Tên Lesson</dt>
            <dd>{lesson.name}</dd>
          </div>
          <div>
            <dt>Thứ tự</dt>
            <dd>#{lesson.orderIndex}</dd>
          </div>
          <div>
            <dt>Điểm yêu cầu</dt>
            <dd>{lesson.requiredScore}%</dd>
          </div>
          <div>
            <dt>Số câu hỏi hiện có</dt>
            <dd>{lessonQuestions.length}</dd>
          </div>
          <div>
            <dt>XP thưởng</dt>
            <dd>{lesson.xpReward} XP</dd>
          </div>
          <div>
            <dt>Kim cương thưởng</dt>
            <dd>{lesson.diamondReward} 💎</dd>
          </div>
          <div>
            <dt>Ngày tạo</dt>
            <dd>{new Date(lesson.createdAt).toLocaleString('vi-VN')}</dd>
          </div>
          <div>
            <dt>Cập nhật gần nhất</dt>
            <dd>{new Date(lesson.updatedAt).toLocaleString('vi-VN')}</dd>
          </div>
        </dl>
        <div style={{ marginTop: 16 }}>
          <Link
            to={`/admin/topics/${lesson.topicId}/lessons`}
            className="admin-button admin-button--secondary"
          >
            ← Danh sách Lesson
          </Link>
        </div>
      </section>

      {/* Phần quản lý danh sách câu hỏi của bài học */}
      <section className="admin-card mt-6">
        <div className="admin-card__header">
          <div>
            <h2>Câu hỏi trong bài học ({lessonQuestions.length})</h2>
            <p>Danh sách các câu hỏi học viên sẽ thực hành trong bài này.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="admin-button admin-button--primary"
              onClick={openCreateQuestionModal}
            >
              + Tạo câu hỏi mới
            </button>
            <button
              type="button"
              className="admin-button admin-button--secondary"
              onClick={() => void openAssignModal()}
            >
              + Gán từ ngân hàng
            </button>
          </div>
        </div>

        {lessonQuestions.length === 0 ? (
          <EmptyState
            title="Bài học chưa có câu hỏi"
            description="Tạo câu hỏi mới hoặc gán câu hỏi từ Ngân hàng câu hỏi vào bài học này."
            action={
              <div className="flex gap-2">
                <button
                  type="button"
                  className="admin-button admin-button--primary"
                  onClick={openCreateQuestionModal}
                >
                  + Tạo câu hỏi mới
                </button>
                <button
                  type="button"
                  className="admin-button admin-button--secondary"
                  onClick={() => void openAssignModal()}
                >
                  + Gán từ ngân hàng
                </button>
              </div>
            }
          />
        ) : (
          <DataTable
            headers={[
              'Thứ tự',
              'Nội dung câu hỏi',
              'Loại câu hỏi',
              'Độ khó',
              'Thao tác',
            ]}
            caption="Danh sách câu hỏi bài học"
          >
            {lessonQuestions.map((lq, idx) => (
              <tr key={lq.id}>
                <td>
                  <strong>#{idx + 1}</strong>
                </td>
                <td className="admin-table__primary">
                  <strong>{lq.question.content}</strong>
                </td>
                <td>
                  <span className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded">
                    {lq.question.type}
                  </span>
                </td>
                <td>
                  <span className="font-bold text-xs">
                    {lq.question.difficulty === 'EASY'
                      ? 'Dễ'
                      : lq.question.difficulty === 'MEDIUM'
                        ? 'Vừa'
                        : 'Khó'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="admin-button admin-button--secondary admin-button--small"
                      onClick={() => {
                        setPreviewQuestion(lq.question)
                        setIsPreviewOpen(true)
                      }}
                    >
                      👀 Xem trước
                    </button>
                    <button
                      type="button"
                      className="admin-button admin-button--danger admin-button--small"
                      onClick={() => setQuestionToRemove(lq)}
                    >
                      Gỡ câu hỏi
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </section>

      <QuestionPreviewModal
        isOpen={isPreviewOpen}
        question={previewQuestion}
        onClose={() => setIsPreviewOpen(false)}
      />


      {/* Modal Tạo Câu Hỏi Trực Tiếp Cho Lesson */}
      <QuestionFormModal
        isOpen={isCreateQuestionModalOpen}
        topicVocabularies={topicVocabularies}
        isLoading={isSubmitting}
        serverError={createQuestionError}
        serverMediaErrors={createQuestionMediaErrors}
        uploadProgress={questionUploadProgress}
        onSubmit={handleCreateQuestionSubmit}
        onClose={() => {
          if (!isSubmitting) {
            setIsCreateQuestionModalOpen(false)
            setCreateQuestionError(null)
            setCreateQuestionMediaErrors({})
            setQuestionUploadProgress(null)
          }
        }}
      />


      {/* Modal Gán Câu Hỏi Nâng Cao với Search, Filter & Multi-Select */}
      {isAssignModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl border-2 border-slate-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">
                  Gán câu hỏi vào bài học
                </h2>
                <p className="text-xs text-slate-500">
                  Tìm kiếm, lọc và chọn các câu hỏi từ Ngân hàng câu hỏi để gán vào bài học này.
                </p>
              </div>
              <button
                type="button"
                className="text-slate-500 p-2 font-bold text-lg"
                onClick={() => setIsAssignModalOpen(false)}
                disabled={isSubmitting}
              >
                ×
              </button>
            </div>

            {/* Filter Bar trong Modal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <input
                className="admin-field"
                placeholder="Tìm nội dung câu hỏi..."
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
              />
              <select
                className="admin-select"
                value={assignTypeFilter}
                onChange={(e) =>
                  setAssignTypeFilter(e.target.value as QuestionType | '')
                }
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
                value={assignDifficultyFilter}
                onChange={(e) =>
                  setAssignDifficultyFilter(
                    e.target.value as VocabularyDifficulty | '',
                  )
                }
              >
                <option value="">Tất cả độ khó</option>
                <option value="EASY">Dễ</option>
                <option value="MEDIUM">Vừa</option>
                <option value="HARD">Khó</option>
              </select>
            </div>

            {/* Danh sách câu hỏi có Checkbox */}
            {filteredAvailableQuestions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 my-2">
                <p className="text-sm text-slate-500 font-semibold">
                  {availableQuestions.length === 0
                    ? 'Tất cả câu hỏi trong Ngân hàng đã được gán vào bài học này.'
                    : 'Không tìm thấy câu hỏi chưa gán nào khớp với bộ lọc.'}
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
                <div className="bg-slate-100 px-4 py-2 flex items-center justify-between border-b border-slate-200 text-xs font-extrabold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-emerald-600"
                      checked={
                        filteredAvailableQuestions.length > 0 &&
                        filteredAvailableQuestions.every((q) =>
                          selectedQuestionIds.includes(q.id),
                        )
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const idsToAdd = filteredAvailableQuestions.map(
                            (q) => q.id,
                          )
                          setSelectedQuestionIds((prev) => [
                            ...Array.from(new Set([...prev, ...idsToAdd])),
                          ])
                        } else {
                          const idsToRemove = new Set(
                            filteredAvailableQuestions.map((q) => q.id),
                          )
                          setSelectedQuestionIds((prev) =>
                            prev.filter((id) => !idsToRemove.has(id)),
                          )
                        }
                      }}
                    />
                    <span>Chọn tất cả ({filteredAvailableQuestions.length})</span>
                  </label>
                  <span className="text-emerald-700 font-bold">
                    Đã chọn {selectedQuestionIds.length} câu hỏi
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {filteredAvailableQuestions.map((q) => {
                    const isChecked = selectedQuestionIds.includes(q.id)
                    return (
                      <label
                        key={q.id}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                          isChecked ? 'bg-emerald-50/60' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded text-emerald-600"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedQuestionIds((prev) => [...prev, q.id])
                            } else {
                              setSelectedQuestionIds((prev) =>
                                prev.filter((id) => id !== q.id),
                              )
                            }
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {q.content}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="font-semibold px-1.5 py-0.5 bg-slate-100 rounded">
                              {q.type}
                            </span>
                            <span>•</span>
                            <span>
                              {q.difficulty === 'EASY'
                                ? 'Dễ'
                                : q.difficulty === 'MEDIUM'
                                  ? 'Vừa'
                                  : 'Khó'}
                            </span>
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                className="admin-button admin-button--secondary"
                onClick={() => setIsAssignModalOpen(false)}
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="admin-button admin-button--primary"
                disabled={isSubmitting || selectedQuestionIds.length === 0}
                onClick={() => void handleAssignQuestion()}
              >
                {isSubmitting
                  ? 'Đang gán...'
                  : `Gán ${selectedQuestionIds.length} câu hỏi`}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <LessonFormModal
        isOpen={isFormOpen}
        lesson={lesson}
        isLoading={isSubmitting}
        serverNameError={serverNameError}
        onSubmit={handleSubmit}
        onClose={() => {
          if (!isSubmitting) {
            setIsFormOpen(false)
            setServerNameError(null)
          }
        }}
      />

      <ConfirmModal
        isOpen={Boolean(pendingStatus)}
        title={
          pendingStatus === 'PUBLISHED'
            ? 'Xuất bản Lesson?'
            : 'Đổi trạng thái Lesson?'
        }
        message={`Chuyển “${lesson.name}” sang ${pendingStatus ?? ''}?`}
        confirmLabel="Xác nhận"
        confirmVariant={pendingStatus === 'PUBLISHED' ? 'primary' : 'warning'}
        isLoading={isMutating}
        onConfirm={() => void handleStatus()}
        onClose={() => setPendingStatus(null)}
      />

      <ConfirmModal
        isOpen={deleteOpen}
        title="Xóa Lesson"
        message={`Xóa vĩnh viễn “${lesson.name}”? Thao tác này không xóa Topic.`}
        confirmLabel="Xóa Lesson"
        confirmVariant="danger"
        isLoading={isMutating}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteOpen(false)}
      />

      <ConfirmModal
        isOpen={Boolean(questionToRemove)}
        title="Gỡ câu hỏi khỏi bài học"
        message={`Gỡ câu hỏi “${questionToRemove?.question.content ?? ''}” khỏi bài học này?`}
        confirmLabel="Gỡ câu hỏi"
        confirmVariant="danger"
        isLoading={isMutating}
        onConfirm={() => void handleRemoveQuestion()}
        onClose={() => setQuestionToRemove(null)}
      />
    </div>
  )
}
