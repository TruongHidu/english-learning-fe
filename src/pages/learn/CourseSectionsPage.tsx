import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SectionCard from '../../components/course/SectionCard'
import { courseService } from '../../services/course.service'
import type {
  CourseResponse,
  UserCourseSectionResponse,
} from '../../types/course.types'

export default function CourseSectionsPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const [course, setCourse] = useState<CourseResponse | null>(null)
  const [sections, setSections] = useState<UserCourseSectionResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!courseId) return
    setIsLoading(true)
    setError(null)

    try {
      const [courseData, sectionsData] = await Promise.all([
        courseService.getPublishedCourseById(courseId),
        courseService.getPublishedSections(courseId),
      ])
      setCourse(courseData)
      setSections(sectionsData)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải thông tin phần học.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  return (
    <>
      <main className="section-main">
        <div className="mb-4">
          <Link
            to="/learn"
            className="learning-back-action inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-black uppercase tracking-wider transition-colors"
          >
            <span>←</span>
            <span>Đổi khóa học khác</span>
          </Link>
        </div>

        {isLoading && (
          <div className="space-y-4" aria-busy="true">
            <div className="learning-skeleton h-20 rounded-2xl animate-pulse border-2" />
            <div className="learning-skeleton h-28 rounded-2xl animate-pulse border-2" />
            <div className="learning-skeleton h-28 rounded-2xl animate-pulse border-2" />
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 text-center" role="alert">
            <span className="text-3xl block mb-2">⚠️</span>
            <h2 className="text-lg font-extrabold text-rose-700 mb-1">
              Khóa học không khả dụng
            </h2>
            <p className="text-sm text-rose-600 mb-4">{error}</p>
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/learn"
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs rounded-xl transition-all uppercase tracking-wider"
              >
                Về danh sách khóa học
              </Link>
              <button
                type="button"
                onClick={() => void loadData()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-[0_4px_0_#9f1239] active:translate-y-1 active:shadow-none transition-all cursor-pointer uppercase tracking-wider"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        {!isLoading && !error && course && (
          <>
            <header className="learning-surface learning-surface--raised border-2 rounded-2xl p-5 md:p-6 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                      {course.level}
                    </span>
                    <span className="learning-subtle-color text-xs font-bold">
                      Khóa học #{course.orderIndex}
                    </span>
                  </div>
                  <h1 className="learning-heading-color text-xl md:text-2xl font-black mb-1">
                    {course.name}
                  </h1>
                  {course.description && (
                    <p className="learning-muted-color text-sm leading-relaxed max-w-2xl">
                      {course.description}
                    </p>
                  )}
                </div>
              </div>
            </header>

            <section aria-label="Danh sách phần học">
              <h2 className="learning-muted-color text-sm font-black uppercase tracking-widest mb-4">
                CÁC PHẦN HỌC ({sections.length})
              </h2>

              {sections.length === 0 ? (
                <div className="learning-surface learning-surface--raised border-2 rounded-2xl p-8 text-center">
                  <span className="text-4xl block mb-2">🌱</span>
                  <h3 className="learning-heading-color text-base font-extrabold mb-1">
                    Khóa học này chưa có phần học nào
                  </h3>
                  <p className="learning-muted-color text-xs">
                    Nội dung đang được cập nhật. Bạn vui lòng quay lại sau nhé!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map((section) => (
                    <SectionCard key={section.id} courseId={courseId ?? ''} section={section} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <aside className="right-rail" aria-label="Thông tin khóa học">
        <article className="sample-card">
          <span className="sample-card__eyebrow">KHÓA HỌC</span>
          <h2>{course?.name ?? 'Đang tải...'}</h2>
          <p>
            Hoàn thành các phần học theo thứ tự từ trên xuống dưới để nắm vững kiến thức ngữ pháp và từ vựng.
          </p>
        </article>
      </aside>
    </>
  )
}
