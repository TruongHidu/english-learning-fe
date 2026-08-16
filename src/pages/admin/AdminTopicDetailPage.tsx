import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import ConfirmModal from '../../components/admin/ConfirmModal'
import DataTable from '../../components/admin/DataTable'
import EmptyState from '../../components/admin/EmptyState'
import ErrorState from '../../components/admin/ErrorState'
import LessonFormModal from '../../components/admin/LessonFormModal'
import LoadingState from '../../components/admin/LoadingState'
import PageHeader from '../../components/admin/PageHeader'
import StatusBadge from '../../components/admin/StatusBadge'
import TopicFormModal from '../../components/admin/TopicFormModal'
import type { LessonFormValues } from '../../schemas/lesson.schema'
import type { TopicFormValues } from '../../schemas/topic.schema'
import { adminLessonService } from '../../services/admin-lesson.service'
import { adminTopicService } from '../../services/admin-topic.service'
import type { ContentStatus } from '../../types/course.types'
import type { LessonResponse } from '../../types/lesson.types'
import type { TopicResponse } from '../../types/topic.types'
import { getAdminContentError, getDuplicateNameError } from '../../utils/admin-content-errors'
import { assignOrderIndexes, moveItemById, moveItemByOffset } from '../../utils/reorder'

type TopicTab = 'overview' | 'lessons' | 'words' | 'questions'

interface PendingLessonStatus {
  lesson: LessonResponse
  status: ContentStatus
}

export default function AdminTopicDetailPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const location = useLocation()
  const [tab, setTab] = useState<TopicTab>(() => location.pathname.endsWith('/lessons') ? 'lessons' : 'overview')
  const [topic, setTopic] = useState<TopicResponse | null>(null)
  const [lessons, setLessons] = useState<LessonResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isTopicFormOpen, setIsTopicFormOpen] = useState(false)
  const [isLessonFormOpen, setIsLessonFormOpen] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<LessonResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverNameError, setServerNameError] = useState<string | null>(null)
  const [pendingStatus, setPendingStatus] = useState<PendingLessonStatus | null>(null)
  const [lessonToDelete, setLessonToDelete] = useState<LessonResponse | null>(null)
  const [isMutating, setIsMutating] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!topicId) { setError('Thiếu mã Topic.'); setIsLoading(false); return }
    setIsLoading(true)
    setError(null)
    try {
      const [topicData, lessonData] = await Promise.all([adminTopicService.getTopicById(topicId), adminLessonService.getLessonsByTopic(topicId)])
      setTopic(topicData)
      setLessons(lessonData)
    } catch (err: unknown) {
      setError(getAdminContentError(err, 'Không thể tải dữ liệu Topic.'))
    } finally {
      setIsLoading(false)
    }
  }, [topicId])

  useEffect(() => { void loadData() }, [loadData])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    window.setTimeout(() => setNotification(null), 4500)
  }

  const handleTopicSubmit = async (values: TopicFormValues) => {
    if (!topic) return
    setIsSubmitting(true)
    setServerNameError(null)
    try {
      const updated = await adminTopicService.updateTopic(topic.id, { name: values.name, description: values.description })
      setTopic(updated)
      setIsTopicFormOpen(false)
      showNotification('success', 'Đã cập nhật Topic.')
    } catch (err: unknown) {
      const duplicate = getDuplicateNameError(err)
      if (duplicate) setServerNameError(duplicate)
      else showNotification('error', getAdminContentError(err, 'Không thể cập nhật Topic.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const openCreateLesson = () => { setSelectedLesson(null); setServerNameError(null); setIsLessonFormOpen(true) }
  const openEditLesson = (lesson: LessonResponse) => { setSelectedLesson(lesson); setServerNameError(null); setIsLessonFormOpen(true) }

  const handleLessonSubmit = async (values: LessonFormValues) => {
    if (!topicId) return
    setIsSubmitting(true)
    setServerNameError(null)
    try {
      if (selectedLesson) {
        const updated = await adminLessonService.updateLesson(selectedLesson.id, {
          name: values.name,
          description: values.description,
          requiredScore: values.requiredScore,
          questionCount: values.questionCount,
          xpReward: values.xpReward,
          diamondReward: values.diamondReward,
        })
        setLessons((current) => current.map((lesson) => lesson.id === updated.id ? updated : lesson))
        showNotification('success', 'Đã cập nhật Lesson.')
      } else {
        const created = await adminLessonService.createLesson(topicId, values)
        setLessons((current) => [...current, created].sort((a, b) => a.orderIndex - b.orderIndex))
        setTopic((current) => current ? { ...current, lessonCount: (current.lessonCount ?? lessons.length) + 1 } : current)
        showNotification('success', 'Đã tạo Lesson mới.')
      }
      setIsLessonFormOpen(false)
      setSelectedLesson(null)
    } catch (err: unknown) {
      const duplicate = getDuplicateNameError(err)
      if (duplicate) setServerNameError(duplicate)
      else showNotification('error', getAdminContentError(err, 'Không thể lưu Lesson.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async () => {
    if (!pendingStatus) return
    setIsMutating(true)
    try {
      const updated = await adminLessonService.updateLessonStatus(pendingStatus.lesson.id, pendingStatus.status)
      setLessons((current) => current.map((lesson) => lesson.id === updated.id ? updated : lesson))
      showNotification('success', 'Đã cập nhật trạng thái Lesson.')
      setPendingStatus(null)
    } catch (err: unknown) {
      setPendingStatus(null)
      showNotification('error', getAdminContentError(err, 'Không thể đổi trạng thái Lesson.'))
    } finally {
      setIsMutating(false)
    }
  }

  const handleDelete = async () => {
    if (!lessonToDelete) return
    setIsMutating(true)
    try {
      await adminLessonService.deleteLesson(lessonToDelete.id)
      setLessons((current) => current.filter((lesson) => lesson.id !== lessonToDelete.id))
      setTopic((current) => current ? { ...current, lessonCount: Math.max(0, (current.lessonCount ?? lessons.length) - 1) } : current)
      showNotification('success', 'Đã xóa Lesson.')
      setLessonToDelete(null)
    } catch (err: unknown) {
      showNotification('error', getAdminContentError(err, 'Không thể xóa Lesson.'))
      setLessonToDelete(null)
    } finally {
      setIsMutating(false)
    }
  }

  const persistOrder = async (nextLessons: LessonResponse[]) => {
    if (!topicId || nextLessons.length === 0 || nextLessons === lessons || isReordering) return
    const previous = lessons
    const optimistic = assignOrderIndexes(nextLessons)
    setLessons(optimistic)
    setIsReordering(true)
    try {
      await adminLessonService.reorderLessons(topicId, optimistic.map((lesson) => lesson.id))
      showNotification('success', 'Đã lưu thứ tự Lesson.')
    } catch (err: unknown) {
      setLessons(previous)
      showNotification('error', getAdminContentError(err, 'Không thể sắp xếp Lesson. Danh sách đã được khôi phục.'))
    } finally {
      setIsReordering(false)
      setDraggedId(null)
    }
  }

  if (isLoading) return <div className="admin-page"><LoadingState label="Đang tải Topic và Lesson..." /></div>
  if (error || !topic) return <div className="admin-page"><ErrorState title="Không thể tải Topic" message={error || 'Không tìm thấy Topic.'} onRetry={() => void loadData()} /></div>

  return (
    <div className="admin-page">
      <PageHeader eyebrow="Nội dung học / Topic" title={topic.name} description={topic.description || 'Topic chưa có mô tả.'} action={<span className="admin-actions"><StatusBadge status={topic.status} size="md" /><button type="button" className="admin-button admin-button--secondary" onClick={() => { setServerNameError(null); setIsTopicFormOpen(true) }}>Sửa Topic</button></span>} />
      {notification ? <div className={`admin-notification admin-notification--${notification.type}`} role="status"><span>{notification.message}</span><button type="button" onClick={() => setNotification(null)}>×</button></div> : null}
      <div className="admin-tabs" role="tablist">{([['overview','Tổng quan'],['lessons',`Màn học (${lessons.length})`],['words','Từ vựng'],['questions','Câu hỏi']] as const).map(([value,label]) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)}>{label}</button>)}</div>

      {tab === 'overview' ? <section className="admin-card"><div className="admin-card__header"><div><h2>Thông tin Topic</h2><p>Dữ liệu thật từ Topic API.</p></div></div><dl className="admin-detail-list"><div><dt>Tên Topic</dt><dd>{topic.name}</dd></div><div><dt>Thứ tự</dt><dd>#{topic.orderIndex}</dd></div><div><dt>Mô tả</dt><dd>{topic.description || 'Chưa có mô tả'}</dd></div><div><dt>Trạng thái</dt><dd><StatusBadge status={topic.status} /></dd></div><div><dt>Số Lesson</dt><dd>{topic.lessonCount ?? lessons.length}</dd></div><div><dt>Cập nhật gần nhất</dt><dd>{new Date(topic.updatedAt).toLocaleString('vi-VN')}</dd></div></dl><div style={{ marginTop: 16 }}><Link to={`/admin/sections/${topic.sectionId}/topics`} className="admin-button admin-button--secondary">← Danh sách Topic</Link></div></section> : null}

      {tab === 'lessons' ? <section className="admin-card"><div className="admin-card__header"><div><h2>Danh sách Lesson</h2><p>Kéo hàng hoặc dùng nút ↑ ↓ để thay đổi thứ tự. {isReordering ? 'Đang lưu...' : ''}</p></div><button type="button" className="admin-button admin-button--primary" onClick={openCreateLesson}>+ Thêm Lesson</button></div>{lessons.length === 0 ? <EmptyState title="Topic chưa có Lesson" description="Thêm Lesson đầu tiên để tạo nội dung học." action={<button type="button" className="admin-button admin-button--primary" onClick={openCreateLesson}>+ Thêm Lesson</button>} /> : <DataTable headers={['Sắp xếp','Lesson','Điểm','Câu hỏi','Phần thưởng','Trạng thái','Thao tác']} minWidth={1080} caption="Danh sách Lesson">{lessons.map((lesson, index) => <tr key={lesson.id} draggable={!isReordering} className={draggedId === lesson.id ? 'admin-draggable-row admin-draggable-row--dragging' : 'admin-draggable-row'} onDragStart={() => setDraggedId(lesson.id)} onDragEnd={() => setDraggedId(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedId) void persistOrder(moveItemById(lessons, draggedId, lesson.id)) }}><td><span className="admin-drag-handle" title="Kéo để sắp xếp">☰</span><span className="admin-order-buttons"><button type="button" disabled={index === 0 || isReordering} onClick={() => void persistOrder(moveItemByOffset(lessons, lesson.id, -1))} aria-label={`Đưa ${lesson.name} lên`}>↑</button><button type="button" disabled={index === lessons.length - 1 || isReordering} onClick={() => void persistOrder(moveItemByOffset(lessons, lesson.id, 1))} aria-label={`Đưa ${lesson.name} xuống`}>↓</button></span></td><td><strong className="admin-table__primary">{lesson.name}</strong><span className="admin-table__secondary">#{lesson.orderIndex} · {lesson.description || 'Chưa có mô tả'}</span></td><td>{lesson.requiredScore}%</td><td>{lesson.questionCount}</td><td>{lesson.xpReward} XP · {lesson.diamondReward} 💎</td><td><StatusBadge status={lesson.status} /></td><td><span className="admin-actions"><Link to={`/admin/lessons/${lesson.id}`} className="admin-button admin-button--secondary admin-button--small">Chi tiết</Link><button type="button" className="admin-button admin-button--secondary admin-button--small" onClick={() => openEditLesson(lesson)}>Sửa</button><select className="admin-select admin-select--small" value={lesson.status} disabled={isMutating} onChange={(event) => setPendingStatus({ lesson, status: event.target.value as ContentStatus })} aria-label={`Đổi trạng thái ${lesson.name}`}><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Xuất bản</option><option value="INACTIVE">Ngừng dùng</option></select><button type="button" className="admin-button admin-button--danger admin-button--small" onClick={() => setLessonToDelete(lesson)}>Xóa</button></span></td></tr>)}</DataTable>}</section> : null}
      {tab === 'words' ? <EmptyState title="Từ vựng đang được phát triển" description="Module Vocabulary sẽ được kết nối trong giai đoạn tiếp theo." /> : null}
      {tab === 'questions' ? <EmptyState title="Câu hỏi đang được phát triển" description="Module Question sẽ được kết nối trong giai đoạn tiếp theo." /> : null}

      <TopicFormModal isOpen={isTopicFormOpen} topic={topic} isLoading={isSubmitting} serverNameError={serverNameError} onSubmit={handleTopicSubmit} onClose={() => { if (!isSubmitting) { setIsTopicFormOpen(false); setServerNameError(null) } }} />
      <LessonFormModal isOpen={isLessonFormOpen} lesson={selectedLesson} nextOrderIndex={lessons.length ? Math.max(...lessons.map((lesson) => lesson.orderIndex)) + 1 : 0} isLoading={isSubmitting} serverNameError={serverNameError} onSubmit={handleLessonSubmit} onClose={() => { if (!isSubmitting) { setIsLessonFormOpen(false); setSelectedLesson(null); setServerNameError(null) } }} />
      <ConfirmModal isOpen={Boolean(pendingStatus)} title={pendingStatus?.status === 'PUBLISHED' ? 'Xuất bản Lesson?' : 'Đổi trạng thái Lesson?'} message={`Chuyển “${pendingStatus?.lesson.name ?? ''}” sang ${pendingStatus?.status ?? ''}?`} confirmLabel="Xác nhận" confirmVariant={pendingStatus?.status === 'PUBLISHED' ? 'primary' : 'warning'} isLoading={isMutating} onConfirm={() => void handleStatusChange()} onClose={() => setPendingStatus(null)} />
      <ConfirmModal isOpen={Boolean(lessonToDelete)} title="Xóa Lesson" message={`Xóa vĩnh viễn “${lessonToDelete?.name ?? ''}”? Thao tác này không xóa Topic.`} confirmLabel="Xóa Lesson" confirmVariant="danger" isLoading={isMutating} onConfirm={() => void handleDelete()} onClose={() => setLessonToDelete(null)} />
    </div>
  )
}
