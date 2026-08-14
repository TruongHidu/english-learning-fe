import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ConfirmModal from '../../components/admin/ConfirmModal'
import SectionFormModal from '../../components/admin/SectionFormModal'
import StatusBadge from '../../components/admin/StatusBadge'
import type { SectionFormValues } from '../../schemas/section.schema'
import { adminCourseService } from '../../services/admin-course.service'
import { adminSectionService } from '../../services/admin-section.service'
import type {
  ContentStatus,
  CourseResponse,
  SectionResponse,
} from '../../types/course.types'

export default function AdminSectionListPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const [course, setCourse] = useState<CourseResponse | null>(null)
  const [sections, setSections] = useState<SectionResponse[]>([])
  const [statusFilter, setStatusFilter] = useState<ContentStatus | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState<SectionResponse | null>(null)
  const [isFormSubmitting, setIsFormSubmitting] = useState(false)

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [sectionToDeactivate, setSectionToDeactivate] = useState<SectionResponse | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)

  const loadData = useCallback(async () => {
    if (!courseId) return
    setIsLoading(true)
    setError(null)
    try {
      const [courseData, sectionsData] = await Promise.all([
        adminCourseService.getAdminCourseById(courseId),
        adminSectionService.getAdminSections(courseId, statusFilter || undefined),
      ])
      setCourse(courseData)
      setSections(sectionsData)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải thông tin phần học.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [courseId, statusFilter])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification(null)
    }, 4000)
  }

  // Create or Update Section
  const handleFormSubmit = async (values: SectionFormValues) => {
    if (!courseId) return
    setIsFormSubmitting(true)
    try {
      if (selectedSection) {
        await adminSectionService.updateSection(selectedSection.id, values)
        showNotification('success', `Đã cập nhật phần học "${values.name}" thành công!`)
      } else {
        await adminSectionService.createSection(courseId, values)
        showNotification('success', `Đã thêm phần học "${values.name}" thành công!`)
      }
      setIsFormModalOpen(false)
      setSelectedSection(null)
      await loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Thao tác không thành công.'
      showNotification('error', msg)
    } finally {
      setIsFormSubmitting(false)
    }
  }

  // Toggle Publish / Draft
  const handleToggleStatus = async (section: SectionResponse) => {
    const nextStatus: ContentStatus = section.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    try {
      await adminSectionService.updateSectionStatus(section.id, nextStatus)
      showNotification(
        'success',
        `Đã chuyển trạng thái phần học "${section.name}" thành ${
          nextStatus === 'PUBLISHED' ? 'ĐÃ PHÁT HÀNH' : 'BẢN NHÁP'
        }!`,
      )
      await loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể đổi trạng thái phần học.'
      showNotification('error', msg)
    }
  }

  // Deactivate
  const handleConfirmDeactivate = async () => {
    if (!sectionToDeactivate) return
    setIsDeactivating(true)
    try {
      await adminSectionService.deactivateSection(sectionToDeactivate.id)
      showNotification(
        'success',
        `Đã ngừng sử dụng phần học "${sectionToDeactivate.name}".`,
      )
      setIsConfirmModalOpen(false)
      setSectionToDeactivate(null)
      await loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể ngừng sử dụng phần học.'
      showNotification('error', msg)
    } finally {
      setIsDeactivating(false)
    }
  }

  return (
    <>
      <div className="w-full max-w-5xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
          <Link to="/admin/courses" className="hover:text-emerald-600 transition-colors">
            Khóa học
          </Link>
          <span>›</span>
          <span className="text-slate-700 truncate max-w-xs">{course?.name ?? '...'}</span>
          <span>›</span>
          <span className="text-emerald-600">Quản lý Section</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800">
              {course?.name ?? 'Phần học'}
            </h1>
            {course && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-slate-100 text-slate-700 uppercase tracking-wider">
                  Trình độ {course.level}
                </span>
                <StatusBadge status={course.status} size="sm" />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedSection(null)
              setIsFormModalOpen(true)
            }}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-[0_4px_0_#047857] active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider shrink-0"
          >
            <span>+</span>
            <span>Thêm phần học mới</span>
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

        {/* Filter by status */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 mb-6 shadow-[0_4px_0_#e2e8f0] flex items-center justify-between gap-4">
          <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
            Lọc trạng thái phần học:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ContentStatus | '')}
            className="px-3 py-1.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">Bản nháp (DRAFT)</option>
            <option value="PUBLISHED">Đã phát hành (PUBLISHED)</option>
            <option value="INACTIVE">Ngừng sử dụng (INACTIVE)</option>
          </select>
        </div>

        {/* List */}
        {isLoading && (
          <div className="space-y-3" aria-busy="true">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-20 bg-slate-100 rounded-2xl animate-pulse border-2 border-slate-200" />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 text-center" role="alert">
            <span className="text-3xl block mb-2">⚠️</span>
            <h3 className="text-base font-extrabold text-rose-700 mb-1">
              Không thể tải danh sách phần học
            </h3>
            <p className="text-xs text-rose-600 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => void loadData()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-[0_4px_0_#9f1239] transition-all cursor-pointer uppercase tracking-wider"
            >
              Thử lại
            </button>
          </div>
        )}

        {!isLoading && !error && sections.length === 0 && (
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-10 text-center shadow-[0_4px_0_#e2e8f0]">
            <span className="text-4xl block mb-2">🌱</span>
            <h3 className="text-lg font-extrabold text-slate-800 mb-1">
              Chưa có phần học nào
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Nhấn nút &quot;Thêm phần học mới&quot; phía trên để bắt đầu thêm nội dung cho khóa học này.
            </p>
          </div>
        )}

        {!isLoading && !error && sections.length > 0 && (
          <div className="space-y-3">
            {sections.map((section) => (
              <article
                key={section.id}
                className="bg-white border-2 border-slate-200 rounded-2xl p-4 md:p-5 shadow-[0_4px_0_#e2e8f0] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-sm text-slate-700 shrink-0">
                    {section.orderIndex}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-400">
                        Thứ tự #{section.orderIndex}
                      </span>
                      <StatusBadge status={section.status} size="sm" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-800">
                      {section.name}
                    </h3>
                    {section.description && (
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {section.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSection(section)
                      setIsFormModalOpen(true)
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Sửa
                  </button>

                  {section.status !== 'INACTIVE' && (
                    <button
                      type="button"
                      onClick={() => void handleToggleStatus(section)}
                      className={`px-3 py-1.5 font-extrabold text-xs rounded-xl border transition-colors cursor-pointer ${
                        section.status === 'PUBLISHED'
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {section.status === 'PUBLISHED' ? 'Chuyển Nháp' : 'Xuất bản'}
                    </button>
                  )}

                  {section.status !== 'INACTIVE' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSectionToDeactivate(section)
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
          </div>
        )}
      </div>

      <SectionFormModal
        isOpen={isFormModalOpen}
        section={selectedSection}
        isLoading={isFormSubmitting}
        onSubmit={handleFormSubmit}
        onClose={() => {
          setIsFormModalOpen(false)
          setSelectedSection(null)
        }}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Ngừng sử dụng phần học"
        message={`Bạn có chắc chắn muốn ngừng sử dụng phần học "${sectionToDeactivate?.name}"? Phần học sẽ chuyển sang trạng thái INACTIVE.`}
        confirmLabel="XÁC NHẬN NGỪNG DÙNG"
        confirmVariant="danger"
        isLoading={isDeactivating}
        onConfirm={() => void handleConfirmDeactivate()}
        onClose={() => {
          setIsConfirmModalOpen(false)
          setSectionToDeactivate(null)
        }}
      />
    </>
  )
}
