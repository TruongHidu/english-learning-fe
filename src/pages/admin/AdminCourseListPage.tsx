import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmModal from '../../components/admin/ConfirmModal'
import CourseFormModal from '../../components/admin/CourseFormModal'
import DataTable from '../../components/admin/DataTable'
import EmptyState from '../../components/admin/EmptyState'
import ErrorState from '../../components/admin/ErrorState'
import LoadingState from '../../components/admin/LoadingState'
import PageHeader from '../../components/admin/PageHeader'
import SearchInput from '../../components/admin/SearchInput'
import StatusBadge from '../../components/admin/StatusBadge'
import type { CourseFormValues } from '../../schemas/course.schema'
import { adminCourseService } from '../../services/admin-course.service'
import type { ContentStatus, CourseResponse, PaginationMeta } from '../../types/course.types'

export default function AdminCourseListPage() {
  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContentStatus | ''>('')
  const [levelFilter, setLevelFilter] = useState('')
  const [page, setPage] = useState(1)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<CourseResponse | null>(null)
  const [isFormSubmitting, setIsFormSubmitting] = useState(false)
  const [courseToDeactivate, setCourseToDeactivate] = useState<CourseResponse | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => { setDebouncedSearch(value); setPage(1) }, 400)
  }

  useEffect(() => () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
  }, [])

  const loadCourses = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await adminCourseService.getAdminCourses({ page, limit: 10, search: debouncedSearch, status: statusFilter || undefined, level: levelFilter || undefined })
      setCourses(data.courses)
      setPagination(data.pagination)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách khóa học.')
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, levelFilter, page, statusFilter])

  useEffect(() => { void loadCourses() }, [loadCourses])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    window.setTimeout(() => setNotification(null), 4000)
  }

  const handleFormSubmit = async (values: CourseFormValues) => {
    setIsFormSubmitting(true)
    try {
      if (selectedCourse) await adminCourseService.updateCourse(selectedCourse.id, values)
      else await adminCourseService.createCourse(values)
      showNotification('success', selectedCourse ? 'Đã cập nhật khóa học.' : 'Đã tạo khóa học mới.')
      setIsFormModalOpen(false)
      setSelectedCourse(null)
      await loadCourses()
    } catch (err: unknown) {
      showNotification('error', err instanceof Error ? err.message : 'Thao tác không thành công.')
    } finally {
      setIsFormSubmitting(false)
    }
  }

  const handleToggleStatus = async (course: CourseResponse) => {
    const nextStatus: ContentStatus = course.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    try {
      await adminCourseService.updateCourseStatus(course.id, nextStatus)
      showNotification('success', `Đã chuyển “${course.name}” sang ${nextStatus}.`)
      await loadCourses()
    } catch (err: unknown) {
      showNotification('error', err instanceof Error ? err.message : 'Không thể đổi trạng thái khóa học.')
    }
  }

  const handleDeactivate = async () => {
    if (!courseToDeactivate) return
    setIsDeactivating(true)
    try {
      await adminCourseService.deactivateCourse(courseToDeactivate.id)
      showNotification('success', `Đã ngừng sử dụng “${courseToDeactivate.name}”.`)
      setCourseToDeactivate(null)
      await loadCourses()
    } catch (err: unknown) {
      showNotification('error', err instanceof Error ? err.message : 'Không thể ngừng sử dụng khóa học.')
    } finally {
      setIsDeactivating(false)
    }
  }

  const openCreateModal = () => { setSelectedCourse(null); setIsFormModalOpen(true) }

  return (
    <div className="admin-page">
      <PageHeader eyebrow="Quản lý học tập" title="Khóa học" description="Quản lý thông tin khóa học và cấu trúc Section từ backend hiện tại." action={<button type="button" className="admin-button admin-button--primary" onClick={openCreateModal}>+ Thêm khóa học</button>} />

      {notification ? <div className={`admin-notification admin-notification--${notification.type}`} role="status"><span>{notification.message}</span><button type="button" onClick={() => setNotification(null)}>×</button></div> : null}

      <div className="admin-filter-bar">
        <SearchInput value={searchInput} onChange={handleSearchChange} placeholder="Tìm theo tên khóa học..." />
        <select className="admin-select" value={levelFilter} onChange={(event) => { setLevelFilter(event.target.value); setPage(1) }} aria-label="Lọc trình độ"><option value="">Tất cả trình độ</option>{['A1','A2','B1','B2','C1','C2'].map((level) => <option key={level}>{level}</option>)}</select>
        <select className="admin-select" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as ContentStatus | ''); setPage(1) }} aria-label="Lọc trạng thái"><option value="">Tất cả trạng thái</option><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Đã phát hành</option><option value="INACTIVE">Ngừng sử dụng</option></select>
      </div>

      {isLoading ? <LoadingState label="Đang tải khóa học..." /> : null}
      {!isLoading && error ? <ErrorState title="Không thể tải danh sách khóa học" message={error} onRetry={() => void loadCourses()} /> : null}
      {!isLoading && !error && courses.length === 0 ? <EmptyState title="Chưa có khóa học nào" description="Tạo khóa học đầu tiên để bắt đầu xây dựng nội dung." action={<button type="button" className="admin-button admin-button--primary" onClick={openCreateModal}>+ Tạo khóa học</button>} /> : null}

      {!isLoading && !error && courses.length > 0 ? (
        <>
          <DataTable headers={['Tên khóa học','Trình độ','Sections','Thứ tự','Trạng thái','Thao tác']} minWidth={920} caption="Danh sách khóa học">
            {courses.map((course) => (
              <tr key={course.id}>
                <td><strong className="admin-table__primary">{course.name}</strong><span className="admin-table__secondary">{course.description || 'Chưa có mô tả'}</span></td>
                <td>{course.level}</td>
                <td><span title="API danh sách chưa trả về sectionCount">—</span></td>
                <td>#{course.orderIndex}</td>
                <td><StatusBadge status={course.status} /></td>
                <td><span className="admin-actions"><Link className="admin-button admin-button--secondary admin-button--small" to={`/admin/courses/${course.id}`}>Xem / Quản lý</Link><button type="button" className="admin-button admin-button--secondary admin-button--small" onClick={() => { setSelectedCourse(course); setIsFormModalOpen(true) }}>Sửa</button>{course.status !== 'INACTIVE' ? <><button type="button" className="admin-button admin-button--secondary admin-button--small" onClick={() => void handleToggleStatus(course)}>{course.status === 'PUBLISHED' ? 'Về nháp' : 'Xuất bản'}</button><button type="button" className="admin-button admin-button--danger admin-button--small" onClick={() => setCourseToDeactivate(course)}>Ngừng dùng</button></> : null}</span></td>
              </tr>
            ))}
          </DataTable>
          <div className="admin-pagination"><span>Trang {pagination.page}/{pagination.totalPages} · {pagination.total} khóa học</span><span className="admin-actions"><button type="button" className="admin-button admin-button--secondary admin-button--small" disabled={pagination.page <= 1} onClick={() => setPage((current) => Math.max(1,current - 1))}>Trang trước</button><button type="button" className="admin-button admin-button--secondary admin-button--small" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Trang sau</button></span></div>
        </>
      ) : null}

      <CourseFormModal isOpen={isFormModalOpen} course={selectedCourse} isLoading={isFormSubmitting} onSubmit={handleFormSubmit} onClose={() => { setIsFormModalOpen(false); setSelectedCourse(null) }} />
      <ConfirmModal isOpen={Boolean(courseToDeactivate)} title="Ngừng sử dụng khóa học" message={`Bạn có chắc muốn ngừng sử dụng “${courseToDeactivate?.name ?? ''}”? Khóa học sẽ chuyển sang INACTIVE.`} confirmLabel="Xác nhận ngừng dùng" confirmVariant="danger" isLoading={isDeactivating} onConfirm={() => void handleDeactivate()} onClose={() => setCourseToDeactivate(null)} />
    </div>
  )
}
