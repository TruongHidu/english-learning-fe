import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ConfirmModal from '../../components/admin/ConfirmModal'
import DataTable from '../../components/admin/DataTable'
import EmptyState from '../../components/admin/EmptyState'
import ErrorState from '../../components/admin/ErrorState'
import LoadingState from '../../components/admin/LoadingState'
import PageHeader from '../../components/admin/PageHeader'
import StatusBadge from '../../components/admin/StatusBadge'
import TopicFormModal from '../../components/admin/TopicFormModal'
import type { TopicFormValues } from '../../schemas/topic.schema'
import { adminSectionService } from '../../services/admin-section.service'
import { adminTopicService } from '../../services/admin-topic.service'
import type { ContentStatus, SectionResponse } from '../../types/course.types'
import type { TopicResponse } from '../../types/topic.types'
import { getAdminContentError, getDuplicateNameError } from '../../utils/admin-content-errors'
import { assignOrderIndexes, moveItemById, moveItemByOffset } from '../../utils/reorder'

interface PendingTopicStatus {
  topic: TopicResponse
  status: ContentStatus
}

export default function AdminSectionTopicsPage() {
  const { sectionId } = useParams<{ sectionId: string }>()
  const [section, setSection] = useState<SectionResponse | null>(null)
  const [topics, setTopics] = useState<TopicResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<TopicResponse | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverNameError, setServerNameError] = useState<string | null>(null)
  const [pendingStatus, setPendingStatus] = useState<PendingTopicStatus | null>(null)
  const [topicToDelete, setTopicToDelete] = useState<TopicResponse | null>(null)
  const [isMutating, setIsMutating] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!sectionId) { setError('Thiếu mã Section.'); setIsLoading(false); return }
    setIsLoading(true)
    setError(null)
    try {
      const [sectionData, topicData] = await Promise.all([adminSectionService.getAdminSectionById(sectionId), adminTopicService.getTopicsBySection(sectionId)])
      setSection(sectionData)
      setTopics(topicData)
    } catch (err: unknown) {
      setError(getAdminContentError(err, 'Không thể tải danh sách Topic.'))
    } finally {
      setIsLoading(false)
    }
  }, [sectionId])

  useEffect(() => { void loadData() }, [loadData])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    window.setTimeout(() => setNotification(null), 4500)
  }

  const openCreate = () => { setSelectedTopic(null); setServerNameError(null); setIsFormOpen(true) }
  const openEdit = (topic: TopicResponse) => { setSelectedTopic(topic); setServerNameError(null); setIsFormOpen(true) }

  const handleSubmit = async (values: TopicFormValues) => {
    if (!sectionId) return
    setIsSubmitting(true)
    setServerNameError(null)
    try {
      if (selectedTopic) {
        const updated = await adminTopicService.updateTopic(selectedTopic.id, { name: values.name, description: values.description })
        setTopics((current) => current.map((topic) => topic.id === updated.id ? updated : topic))
        showNotification('success', 'Đã cập nhật Topic.')
      } else {
        const created = await adminTopicService.createTopic(sectionId, values)
        setTopics((current) => [...current, created].sort((a, b) => a.orderIndex - b.orderIndex))
        showNotification('success', 'Đã tạo Topic mới.')
      }
      setIsFormOpen(false)
      setSelectedTopic(null)
    } catch (err: unknown) {
      const duplicate = getDuplicateNameError(err)
      if (duplicate) setServerNameError(duplicate)
      else showNotification('error', getAdminContentError(err, 'Không thể lưu Topic.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async () => {
    if (!pendingStatus) return
    setIsMutating(true)
    try {
      const updated = await adminTopicService.updateTopicStatus(pendingStatus.topic.id, pendingStatus.status)
      setTopics((current) => current.map((topic) => topic.id === updated.id ? updated : topic))
      showNotification('success', 'Đã cập nhật trạng thái Topic.')
      setPendingStatus(null)
    } catch (err: unknown) {
      setPendingStatus(null)
      showNotification('error', getAdminContentError(err, 'Không thể đổi trạng thái Topic.'))
    } finally {
      setIsMutating(false)
    }
  }

  const handleDelete = async () => {
    if (!topicToDelete) return
    setIsMutating(true)
    try {
      await adminTopicService.deleteTopic(topicToDelete.id)
      setTopics((current) => current.filter((topic) => topic.id !== topicToDelete.id))
      showNotification('success', 'Đã xóa Topic.')
      setTopicToDelete(null)
    } catch (err: unknown) {
      showNotification('error', getAdminContentError(err, 'Không thể xóa Topic.'))
      setTopicToDelete(null)
    } finally {
      setIsMutating(false)
    }
  }

  const persistOrder = async (nextTopics: TopicResponse[]) => {
    if (!sectionId || nextTopics.length === 0 || nextTopics === topics || isReordering) return
    const previous = topics
    const optimistic = assignOrderIndexes(nextTopics)
    setTopics(optimistic)
    setIsReordering(true)
    try {
      await adminTopicService.reorderTopics(sectionId, optimistic.map((topic) => topic.id))
      showNotification('success', 'Đã lưu thứ tự Topic.')
    } catch (err: unknown) {
      setTopics(previous)
      showNotification('error', getAdminContentError(err, 'Không thể sắp xếp Topic. Danh sách đã được khôi phục.'))
    } finally {
      setIsReordering(false)
      setDraggedId(null)
    }
  }

  if (isLoading) return <div className="admin-page"><LoadingState label="Đang tải Topic..." /></div>
  if (error || !section) return <div className="admin-page"><ErrorState title="Không thể tải Topic" message={error || 'Không tìm thấy Section.'} onRetry={() => void loadData()} /></div>

  return (
    <div className="admin-page">
      <PageHeader eyebrow="Section" title={section.name} description="Quản lý Topic và thứ tự nội dung trong Section." action={<button type="button" className="admin-button admin-button--primary" onClick={openCreate}>+ Thêm Topic</button>} />
      {notification ? <div className={`admin-notification admin-notification--${notification.type}`} role="status"><span>{notification.message}</span><button type="button" onClick={() => setNotification(null)}>×</button></div> : null}
      <div className="admin-filter-bar"><Link to={`/admin/courses/${section.courseId}?tab=content`} className="admin-button admin-button--secondary">← Quay lại khóa học</Link><span className="admin-reorder-status" aria-live="polite">{isReordering ? 'Đang lưu thứ tự...' : 'Kéo hàng hoặc dùng nút ↑ ↓ để sắp xếp'}</span></div>

      {topics.length === 0 ? <EmptyState title="Section chưa có Topic" description="Thêm Topic đầu tiên để bắt đầu xây dựng các Lesson." action={<button type="button" className="admin-button admin-button--primary" onClick={openCreate}>+ Thêm Topic</button>} /> : (
        <DataTable headers={['Sắp xếp','Topic','Thứ tự','Lessons','Trạng thái','Thao tác']} minWidth={920} caption="Danh sách Topic">
          {topics.map((topic, index) => (
            <tr key={topic.id} draggable={!isReordering} className={draggedId === topic.id ? 'admin-draggable-row admin-draggable-row--dragging' : 'admin-draggable-row'} onDragStart={() => setDraggedId(topic.id)} onDragEnd={() => setDraggedId(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedId) void persistOrder(moveItemById(topics, draggedId, topic.id)) }}>
              <td><span className="admin-drag-handle" title="Kéo để sắp xếp">☰</span><span className="admin-order-buttons"><button type="button" disabled={index === 0 || isReordering} onClick={() => void persistOrder(moveItemByOffset(topics, topic.id, -1))} aria-label={`Đưa ${topic.name} lên`}>↑</button><button type="button" disabled={index === topics.length - 1 || isReordering} onClick={() => void persistOrder(moveItemByOffset(topics, topic.id, 1))} aria-label={`Đưa ${topic.name} xuống`}>↓</button></span></td>
              <td><strong className="admin-table__primary">{topic.name}</strong><span className="admin-table__secondary">{topic.description || 'Chưa có mô tả'}</span></td><td>#{topic.orderIndex}</td><td>{topic.lessonCount ?? 0}</td><td><StatusBadge status={topic.status} /></td>
              <td><span className="admin-actions"><Link className="admin-button admin-button--secondary admin-button--small" to={`/admin/topics/${topic.id}`}>Chi tiết</Link><Link className="admin-button admin-button--secondary admin-button--small" to={`/admin/topics/${topic.id}/lessons`}>Lessons</Link><button type="button" className="admin-button admin-button--secondary admin-button--small" onClick={() => openEdit(topic)}>Sửa</button><select className="admin-select admin-select--small" value={topic.status} disabled={isMutating} onChange={(event) => setPendingStatus({ topic, status: event.target.value as ContentStatus })} aria-label={`Đổi trạng thái ${topic.name}`}><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Xuất bản</option><option value="INACTIVE">Ngừng dùng</option></select><button type="button" className="admin-button admin-button--danger admin-button--small" onClick={() => setTopicToDelete(topic)}>Xóa</button></span></td>
            </tr>
          ))}
        </DataTable>
      )}

      <TopicFormModal isOpen={isFormOpen} topic={selectedTopic} nextOrderIndex={topics.length ? Math.max(...topics.map((topic) => topic.orderIndex)) + 1 : 0} isLoading={isSubmitting} serverNameError={serverNameError} onSubmit={handleSubmit} onClose={() => { if (!isSubmitting) { setIsFormOpen(false); setSelectedTopic(null); setServerNameError(null) } }} />
      <ConfirmModal isOpen={Boolean(pendingStatus)} title={pendingStatus?.status === 'PUBLISHED' ? 'Xuất bản Topic?' : 'Đổi trạng thái Topic?'} message={`Chuyển “${pendingStatus?.topic.name ?? ''}” sang ${pendingStatus?.status ?? ''}?`} confirmLabel="Xác nhận" confirmVariant={pendingStatus?.status === 'PUBLISHED' ? 'primary' : 'warning'} isLoading={isMutating} onConfirm={() => void handleStatusChange()} onClose={() => setPendingStatus(null)} />
      <ConfirmModal isOpen={Boolean(topicToDelete)} title="Xóa Topic" message={`Xóa vĩnh viễn “${topicToDelete?.name ?? ''}”? Topic đang chứa Lesson sẽ không thể xóa.`} confirmLabel="Xóa Topic" confirmVariant="danger" isLoading={isMutating} onConfirm={() => void handleDelete()} onClose={() => setTopicToDelete(null)} />
    </div>
  )
}
