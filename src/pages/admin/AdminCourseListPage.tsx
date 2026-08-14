import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmModal from '../../components/admin/ConfirmModal'
import CourseFormModal from '../../components/admin/CourseFormModal'
import StatusBadge from '../../components/admin/StatusBadge'
import type { CourseFormValues } from '../../schemas/course.schema'
import { adminCourseService } from '../../services/admin-course.service'
import type {
  ContentStatus,
  CourseResponse,
  PaginationMeta,
} from '../../types/course.types'

export default function AdminCourseListPage() {
  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Filters
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContentStatus | ''>('')
  const [levelFilter, setLevelFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<CourseResponse | null>(null)
  const [isFormSubmitting, setIsFormSubmitting] = useState(false)

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [courseToDeactivate, setCourseToDeactivate] = useState<CourseResponse | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)

  // Debounce search
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 400)
  }

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  const loadCourses = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await adminCourseService.getAdminCourses({
        page,
        limit: 10,
        search: debouncedSearch,
        status: statusFilter || undefined,
        level: levelFilter || undefined,
      })
      setCourses(data.courses)
      setPagination(data.pagination)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách khóa học.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [page, debouncedSearch, statusFilter, levelFilter])

  useEffect(() => {
    void loadCourses()
  }, [loadCourses])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification(null)
    }, 4000)
  }

  // Create or Update submit
  const handleFormSubmit = async (values: CourseFormValues) => {
    setIsFormSubmitting(true)
    try {
      if (selectedCourse) {
        await adminCourseService.updateCourse(selectedCourse.id, values)
        showNotification('success', `Đã cập nhật khóa học "${values.name}" thành công!`)
      } else {
        await adminCourseService.createCourse(values)
        showNotification('success', `Đã tạo khóa học "${values.name}" thành công!`)
      }
      setIsFormModalOpen(false)
      setSelectedCourse(null)
      await loadCourses()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Thao tác không thành công.'
      showNotification('error', msg)
    } finally {
      setIsFormSubmitting(false)
    }
  }

  // Toggle Publish / Draft
  const handleToggleStatus = async (course: CourseResponse) => {
    const nextStatus: ContentStatus = course.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    try {
      await adminCourseService.updateCourseStatus(course.id, nextStatus)
      showNotification(
        'success',
        `Đã chuyển trạng thái khóa học "${course.name}" thành ${
          nextStatus === 'PUBLISHED' ? 'ĐÃ PHÁT HÀNH' : 'BẢN NHÁP'
        }!`,
      )
      await loadCourses()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể đổi trạng thái khóa học.'
      showNotification('error', msg)
    }
  }

  // Deactivate
  const handleConfirmDeactivate = async () => {
    if (!courseToDeactivate) return
    setIsDeactivating(true)
    try {
      await adminCourseService.deactivateCourse(courseToDeactivate.id)
      showNotification(
        'success',
        `Đã ngừng sử dụng khóa học "${courseToDeactivate.name}". Trạng thái đã chuyển sang INACTIVE.`,
      )
      setIsConfirmModalOpen(false)
      setCourseToDeactivate(null)
      await loadCourses()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể ngừng sử dụng khóa học.'
      showNotification('error', msg)
    } finally {
      setIsDeactivating(false)
    }
  }

  return (
    <>
      <main className="section-main w-full max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600">
              TRUNG TÂM QUẢN TRỊ
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 mt-0.5">
              Quản lý khóa học
            </h1>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCourse(null)
              setIsFormModalOpen(true)
            }}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-[0_4px_0_#047857] active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider shrink-0"
          >
            <span>+</span>
            <span>Tạo khóa học mới</span>
          </button>
        </div>

        {notification && (
          <div
            className={`p-4 rounded-xl mb-4 font-bold text-sm flex items-center justify-between border-2 animate-in fade-in duration-200 ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
            role="status"
          >
            <span>{notification.message}</span>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-xs font-black px-2 py-0.5 rounded-lg hover:bg-black/5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 mb-6 shadow-[0_4px_0_#e2e8f0] flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="🔍 Tìm kiếm theo tên khóa học..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-3.5 pr-4 py-2 rounded-xl border-2 border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ContentStatus | '')
                setPage(1)
              }}
              className="px-3 py-2 rounded-xl border-2 border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="DRAFT">Bản nháp (DRAFT)</option>
              <option value="PUBLISHED">Đã phát hành (PUBLISHED)</option>
              <option value="INACTIVE">Ngừng sử dụng (INACTIVE)</option>
            </select>

            <select
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 rounded-xl border-2 border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
            >
              <option value="">Tất cả trình độ</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
            </select>
          </div>
        </div>

        {/* Content Table / Cards */}
        {isLoading && (
          <div className="space-y-3" aria-busy="true">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-20 bg-slate-100 rounded-2xl animate-pulse border-2 border-slate-200" />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 text-center" role="alert">
            <span className="text-3xl block mb-2">⚠️</span>
            <h3 className="text-base font-extrabold text-rose-700 mb-1">
              Không thể tải danh sách khóa học
            </h3>
            <p className="text-xs text-rose-600 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => void loadCourses()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-[0_4px_0_#9f1239] transition-all cursor-pointer uppercase tracking-wider"
            >
              Thử lại
            </button>
          </div>
        )}

        {!isLoading && !error && courses.length === 0 && (
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-10 text-center shadow-[0_4px_0_#e2e8f0]">
            <span className="text-4xl block mb-2">🔍</span>
            <h3 className="text-lg font-extrabold text-slate-800 mb-1">
              Không tìm thấy khóa học nào
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc trạng thái.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchInput('')
                setDebouncedSearch('')
                setStatusFilter('')
                setLevelFilter('')
                setPage(1)
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        {!isLoading && !error && courses.length > 0 && (
          <div className="space-y-3">
            {courses.map((course) => (
              <article
                key={course.id}
                className="bg-white border-2 border-slate-200 rounded-2xl p-4 md:p-5 shadow-[0_4px_0_#e2e8f0] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-black text-sm text-slate-600 shrink-0">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <span>{course.level}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-slate-100 text-slate-700 uppercase tracking-wider">
                        {course.level}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        #{course.orderIndex}
                      </span>
                      <StatusBadge status={course.status} size="sm" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-800">
                      {course.name}
                    </h3>
                    {course.description && (
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {course.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <Link
                    to={`/admin/courses/${course.id}/sections`}
                    className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-extrabold text-xs rounded-xl border border-sky-200 transition-colors"
                  >
                    Quản lý Section
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourse(course)
                      setIsFormModalOpen(true)
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Sửa
                  </button>

                  {course.status !== 'INACTIVE' && (
                    <button
                      type="button"
                      onClick={() => void handleToggleStatus(course)}
                      className={`px-3 py-1.5 font-extrabold text-xs rounded-xl border transition-colors cursor-pointer ${
                        course.status === 'PUBLISHED'
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {course.status === 'PUBLISHED' ? 'Chuyển Nháp' : 'Xuất bản'}
                    </button>
                  )}

                  {course.status !== 'INACTIVE' && (
                    <button
                      type="button"
                      onClick={() => {
                        setCourseToDeactivate(course)
                        setIsConfirmModalOpen(true)
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors cursor-pointer"
                    >
                      Ngừng dùng
                    </button>
                  )}
                </div>
              </article>
            ))}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-500">
                  Trang {pagination.page} / {pagination.totalPages} ({pagination.total} khóa học)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Trang trước
                  </button>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Trang sau
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <CourseFormModal
        isOpen={isFormModalOpen}
        course={selectedCourse}
        isLoading={isFormSubmitting}
        onSubmit={handleFormSubmit}
        onClose={() => {
          setIsFormModalOpen(false)
          setSelectedCourse(null)
        }}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Ngừng sử dụng khóa học"
        message={`Bạn có chắc chắn muốn ngừng sử dụng khóa học "${courseToDeactivate?.name}"? Khóa học sẽ chuyển sang trạng thái INACTIVE và ẩn khỏi giao diện học viên.`}
        confirmLabel="XÁC NHẬN NGỪNG DÙNG"
        confirmVariant="danger"
        isLoading={isDeactivating}
        onConfirm={() => void handleConfirmDeactivate()}
        onClose={() => {
          setIsConfirmModalOpen(false)
          setCourseToDeactivate(null)
        }}
      />
    </>
  )
}
