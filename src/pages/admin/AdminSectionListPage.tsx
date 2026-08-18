import { useCallback, useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import AdminSectionCard from '../../components/admin/AdminSectionCard'
import ConfirmModal from '../../components/admin/ConfirmModal'
import EmptyState from '../../components/admin/EmptyState'
import ErrorState from '../../components/admin/ErrorState'
import LoadingState from '../../components/admin/LoadingState'
import PageHeader from '../../components/admin/PageHeader'
import SectionFormModal from '../../components/admin/SectionFormModal'
import StatusBadge from '../../components/admin/StatusBadge'
import type { SectionFormValues } from '../../schemas/section.schema'
import { adminCourseService } from '../../services/admin-course.service'
import { adminSectionService } from '../../services/admin-section.service'
import type { ContentStatus, CourseResponse, SectionResponse } from '../../types/course.types'

type CourseTab = 'overview' | 'content'

export default function AdminSectionListPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const location = useLocation()
  const [tab, setTab] = useState<CourseTab>(() => location.pathname.endsWith('/sections') || new URLSearchParams(location.search).get('tab') === 'content' ? 'content' : 'overview')
  const [course, setCourse] = useState<CourseResponse | null>(null)
  const [sections, setSections] = useState<SectionResponse[]>([])
  const [statusFilter, setStatusFilter] = useState<ContentStatus | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState<SectionResponse | null>(null)
  const [isFormSubmitting, setIsFormSubmitting] = useState(false)
  const [sectionToDeactivate, setSectionToDeactivate] = useState<SectionResponse | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)

  const loadData = useCallback(async () => {
    if (!courseId) { setError('Thiếu mã khóa học.'); setIsLoading(false); return }
    setIsLoading(true)
    setError(null)
    try {
      const [courseData, sectionsData] = await Promise.all([adminCourseService.getAdminCourseById(courseId), adminSectionService.getAdminSections(courseId, statusFilter || undefined)])
      setCourse(courseData)
      setSections(sectionsData)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải thông tin khóa học.')
    } finally {
      setIsLoading(false)
    }
  }, [courseId, statusFilter])

  useEffect(() => { void loadData() }, [loadData])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    window.setTimeout(() => setNotification(null), 4000)
  }

  const handleFormSubmit = async (values: SectionFormValues) => {
    if (!courseId) return
    setIsFormSubmitting(true)
    try {
      if (selectedSection) await adminSectionService.updateSection(selectedSection.id, values)
      else await adminSectionService.createSection(courseId, values)
      showNotification('success', selectedSection ? 'Đã cập nhật Section.' : 'Đã thêm Section mới.')
      setIsFormModalOpen(false)
      setSelectedSection(null)
      await loadData()
    } catch (err: unknown) {
      showNotification('error', err instanceof Error ? err.message : 'Thao tác không thành công.')
    } finally {
      setIsFormSubmitting(false)
    }
  }

  const handleToggleStatus = async (section: SectionResponse) => {
    const nextStatus: ContentStatus = section.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    try {
      await adminSectionService.updateSectionStatus(section.id, nextStatus)
      showNotification('success', `Đã chuyển “${section.name}” sang ${nextStatus}.`)
      await loadData()
    } catch (err: unknown) {
      showNotification('error', err instanceof Error ? err.message : 'Không thể đổi trạng thái Section.')
    }
  }

  const handleDeactivate = async () => {
    if (!sectionToDeactivate) return
    setIsDeactivating(true)
    try {
      await adminSectionService.deactivateSection(sectionToDeactivate.id)
      showNotification('success', `Đã ngừng sử dụng “${sectionToDeactivate.name}”.`)
      setSectionToDeactivate(null)
      await loadData()
    } catch (err: unknown) {
      showNotification('error', err instanceof Error ? err.message : 'Không thể ngừng sử dụng Section.')
    } finally {
      setIsDeactivating(false)
    }
  }

  const openCreateSection = () => { setSelectedSection(null); setIsFormModalOpen(true) }

  if (isLoading) return <LoadingState label="Đang tải chi tiết khóa học..." />
  if (error || !course) return <ErrorState title="Không thể tải khóa học" message={error || 'Không tìm thấy khóa học.'} onRetry={() => void loadData()} />

  return (
    <div className="admin-page">
      <PageHeader eyebrow="Nội dung học" title={course.name} description={course.description || 'Khóa học chưa có mô tả.'} action={<StatusBadge status={course.status} size="md" />} />
      {notification ? <div className={`admin-notification admin-notification--${notification.type}`} role="status"><span>{notification.message}</span><button type="button" onClick={() => setNotification(null)}>×</button></div> : null}

      <div className="admin-tabs" role="tablist" aria-label="Chi tiết khóa học">
        <button type="button" role="tab" aria-selected={tab === 'overview'} onClick={() => setTab('overview')}>Tổng quan</button>
        <button type="button" role="tab" aria-selected={tab === 'content'} onClick={() => setTab('content')}>Nội dung ({sections.length})</button>
      </div>

      {tab === 'overview' ? (
        <section className="admin-card">
          <div className="admin-card__header"><div><h2>Thông tin khóa học</h2><p>Dữ liệu thật từ Course API.</p></div></div>
          <div className="admin-grid-2">
            {course.thumbnailUrl ? <img src={course.thumbnailUrl} alt={`Ảnh ${course.name}`} style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 10, border: '1px solid #e1e6ee' }} /> : <div className="admin-state" style={{ minHeight: 220 }}><span className="admin-state__icon">□</span><p>Khóa học chưa có thumbnail.</p></div>}
            <dl className="admin-detail-list" style={{ alignContent: 'start' }}><div><dt>Tên khóa học</dt><dd>{course.name}</dd></div><div><dt>Trình độ</dt><dd>{course.level}</dd></div><div><dt>Thứ tự</dt><dd>#{course.orderIndex}</dd></div><div><dt>Trạng thái</dt><dd><StatusBadge status={course.status} /></dd></div><div><dt>Ngày tạo</dt><dd>{new Date(course.createdAt).toLocaleString('vi-VN')}</dd></div><div><dt>Cập nhật gần nhất</dt><dd>{new Date(course.updatedAt).toLocaleString('vi-VN')}</dd></div></dl>
          </div>
        </section>
      ) : (
        <>
          <div className="admin-filter-bar"><span style={{ flex: 1, color: '#657187', fontSize: 12, fontWeight: 700 }}>Cấu trúc Section trong khóa học</span><select className="admin-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ContentStatus | '')} aria-label="Lọc trạng thái Section"><option value="">Tất cả trạng thái</option><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Đã phát hành</option><option value="INACTIVE">Ngừng sử dụng</option></select><button type="button" className="admin-button admin-button--primary" onClick={openCreateSection}>+ Thêm Section</button></div>
          {sections.length === 0 ? <EmptyState title="Chưa có Section nào" description="Thêm Section đầu tiên để xây dựng cấu trúc nội dung khóa học." action={<button type="button" className="admin-button admin-button--primary" onClick={openCreateSection}>+ Thêm Section</button>} /> : <div style={{ display: 'grid', gap: 12 }}>{sections.map((section) => <AdminSectionCard key={section.id} section={section} onEdit={(value) => { setSelectedSection(value); setIsFormModalOpen(true) }} onToggleStatus={(value) => void handleToggleStatus(value)} onDeactivate={setSectionToDeactivate} />)}</div>}
        </>
      )}

      <SectionFormModal isOpen={isFormModalOpen} section={selectedSection} isLoading={isFormSubmitting} onSubmit={handleFormSubmit} onClose={() => { setIsFormModalOpen(false); setSelectedSection(null) }} />
      <ConfirmModal isOpen={Boolean(sectionToDeactivate)} title="Ngừng sử dụng Section" message={`Bạn có chắc muốn ngừng sử dụng “${sectionToDeactivate?.name ?? ''}”? Section sẽ chuyển sang INACTIVE.`} confirmLabel="Xác nhận ngừng dùng" confirmVariant="danger" isLoading={isDeactivating} onConfirm={() => void handleDeactivate()} onClose={() => setSectionToDeactivate(null)} />
    </div>
  )
}
