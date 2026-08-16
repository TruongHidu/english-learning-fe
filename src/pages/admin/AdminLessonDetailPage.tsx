import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ConfirmModal from '../../components/admin/ConfirmModal'
import ErrorState from '../../components/admin/ErrorState'
import LessonFormModal from '../../components/admin/LessonFormModal'
import LoadingState from '../../components/admin/LoadingState'
import PageHeader from '../../components/admin/PageHeader'
import StatusBadge from '../../components/admin/StatusBadge'
import type { LessonFormValues } from '../../schemas/lesson.schema'
import { adminLessonService } from '../../services/admin-lesson.service'
import type { ContentStatus } from '../../types/course.types'
import type { LessonResponse } from '../../types/lesson.types'
import { getAdminContentError, getDuplicateNameError } from '../../utils/admin-content-errors'

export default function AdminLessonDetailPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState<LessonResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverNameError, setServerNameError] = useState<string | null>(null)
  const [pendingStatus, setPendingStatus] = useState<ContentStatus | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isMutating, setIsMutating] = useState(false)

  const loadData = useCallback(async () => {
    if (!lessonId) { setError('Thiếu mã Lesson.'); setIsLoading(false); return }
    setIsLoading(true)
    setError(null)
    try {
      setLesson(await adminLessonService.getLessonById(lessonId))
    } catch (err: unknown) {
      setError(getAdminContentError(err, 'Không thể tải Lesson.'))
    } finally {
      setIsLoading(false)
    }
  }, [lessonId])

  useEffect(() => { void loadData() }, [loadData])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    window.setTimeout(() => setNotification(null), 4500)
  }

  const handleSubmit = async (values: LessonFormValues) => {
    if (!lesson) return
    setIsSubmitting(true)
    setServerNameError(null)
    try {
      const updated = await adminLessonService.updateLesson(lesson.id, { name: values.name, description: values.description, requiredScore: values.requiredScore, questionCount: values.questionCount, xpReward: values.xpReward, diamondReward: values.diamondReward })
      setLesson(updated)
      setIsFormOpen(false)
      showNotification('success', 'Đã cập nhật Lesson.')
    } catch (err: unknown) {
      const duplicate = getDuplicateNameError(err)
      if (duplicate) setServerNameError(duplicate)
      else showNotification('error', getAdminContentError(err, 'Không thể cập nhật Lesson.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatus = async () => {
    if (!lesson || !pendingStatus) return
    setIsMutating(true)
    try {
      setLesson(await adminLessonService.updateLessonStatus(lesson.id, pendingStatus))
      setPendingStatus(null)
      showNotification('success', 'Đã cập nhật trạng thái Lesson.')
    } catch (err: unknown) {
      setPendingStatus(null)
      showNotification('error', getAdminContentError(err, 'Không thể đổi trạng thái Lesson.'))
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
      showNotification('error', getAdminContentError(err, 'Không thể xóa Lesson.'))
    } finally {
      setIsMutating(false)
    }
  }

  if (isLoading) return <div className="admin-page"><LoadingState label="Đang tải Lesson..." /></div>
  if (error || !lesson) return <div className="admin-page"><ErrorState title="Không thể tải Lesson" message={error || 'Không tìm thấy Lesson.'} onRetry={() => void loadData()} /></div>

  return (
    <div className="admin-page">
      <PageHeader eyebrow="Nội dung học / Lesson" title={lesson.name} description={lesson.description || 'Lesson chưa có mô tả.'} action={<span className="admin-actions"><StatusBadge status={lesson.status} size="md" /><button type="button" className="admin-button admin-button--secondary" onClick={() => { setServerNameError(null); setIsFormOpen(true) }}>Sửa</button><select className="admin-select" value={lesson.status} onChange={(event) => setPendingStatus(event.target.value as ContentStatus)} aria-label="Đổi trạng thái Lesson"><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Xuất bản</option><option value="INACTIVE">Ngừng dùng</option></select><button type="button" className="admin-button admin-button--danger" onClick={() => setDeleteOpen(true)}>Xóa</button></span>} />
      {notification ? <div className={`admin-notification admin-notification--${notification.type}`} role="status"><span>{notification.message}</span><button type="button" onClick={() => setNotification(null)}>×</button></div> : null}
      <section className="admin-card"><div className="admin-card__header"><div><h2>Thông tin chi tiết</h2><p>Dữ liệu thật từ Lesson API.</p></div></div><dl className="admin-detail-list"><div><dt>Tên Lesson</dt><dd>{lesson.name}</dd></div><div><dt>Thứ tự</dt><dd>#{lesson.orderIndex}</dd></div><div><dt>Điểm yêu cầu</dt><dd>{lesson.requiredScore}%</dd></div><div><dt>Số câu hỏi</dt><dd>{lesson.questionCount}</dd></div><div><dt>XP thưởng</dt><dd>{lesson.xpReward} XP</dd></div><div><dt>Kim cương thưởng</dt><dd>{lesson.diamondReward} 💎</dd></div><div><dt>Ngày tạo</dt><dd>{new Date(lesson.createdAt).toLocaleString('vi-VN')}</dd></div><div><dt>Cập nhật gần nhất</dt><dd>{new Date(lesson.updatedAt).toLocaleString('vi-VN')}</dd></div></dl><div style={{ marginTop: 16 }}><Link to={`/admin/topics/${lesson.topicId}/lessons`} className="admin-button admin-button--secondary">← Danh sách Lesson</Link></div></section>
      <LessonFormModal isOpen={isFormOpen} lesson={lesson} isLoading={isSubmitting} serverNameError={serverNameError} onSubmit={handleSubmit} onClose={() => { if (!isSubmitting) { setIsFormOpen(false); setServerNameError(null) } }} />
      <ConfirmModal isOpen={Boolean(pendingStatus)} title={pendingStatus === 'PUBLISHED' ? 'Xuất bản Lesson?' : 'Đổi trạng thái Lesson?'} message={`Chuyển “${lesson.name}” sang ${pendingStatus ?? ''}?`} confirmLabel="Xác nhận" confirmVariant={pendingStatus === 'PUBLISHED' ? 'primary' : 'warning'} isLoading={isMutating} onConfirm={() => void handleStatus()} onClose={() => setPendingStatus(null)} />
      <ConfirmModal isOpen={deleteOpen} title="Xóa Lesson" message={`Xóa vĩnh viễn “${lesson.name}”? Thao tác này không xóa Topic.`} confirmLabel="Xóa Lesson" confirmVariant="danger" isLoading={isMutating} onConfirm={() => void handleDelete()} onClose={() => setDeleteOpen(false)} />
    </div>
  )
}
