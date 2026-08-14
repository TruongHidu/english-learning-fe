import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CourseCard from '../../components/course/CourseCard'
import { courseService } from '../../services/course.service'
import type { CourseResponse } from '../../types/course.types'

export default function LearnPage() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCourses = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await courseService.getPublishedCourses()
      setCourses(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách khóa học.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCourses()
  }, [loadCourses])

  const handleSelectCourse = (course: CourseResponse) => {
    navigate(`/learn/courses/${course.id}`)
  }

  return (
    <>
      <main className="section-main">
        <header className="section-heading mb-6">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-600">
            LỘ TRÌNH HỌC TẬP
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 mt-1">
            Chọn khóa học
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Chọn khóa học phù hợp với trình độ để bắt đầu hành trình học tiếng Anh của bạn.
          </p>
        </header>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5" aria-busy="true">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-72 rounded-2xl bg-slate-100 animate-pulse border-2 border-slate-200"
              />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 text-center" role="alert">
            <span className="text-3xl block mb-2">⚠️</span>
            <h2 className="text-lg font-extrabold text-rose-700 mb-1">
              Không thể tải danh sách khóa học
            </h2>
            <p className="text-sm text-rose-600 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => void loadCourses()}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-[0_4px_0_#9f1239] active:translate-y-1 active:shadow-none transition-all cursor-pointer uppercase tracking-wider"
            >
              Thử lại
            </button>
          </div>
        )}

        {!isLoading && !error && courses.length === 0 && (
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-10 text-center shadow-[0_4px_0_#e2e8f0]">
            <span className="text-5xl block mb-3">📚</span>
            <h2 className="text-xl font-extrabold text-slate-800 mb-2">
              Chưa có khóa học nào được phát hành
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Các khóa học đang được biên soạn và sẽ sớm có mặt. Vui lòng quay lại sau!
            </p>
          </div>
        )}

        {!isLoading && !error && courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onSelect={handleSelectCourse}
              />
            ))}
          </div>
        )}
      </main>

      <aside className="right-rail" aria-label="Thông tin bổ sung">
        <article className="sample-card">
          <span className="sample-card__eyebrow">MỤC TIÊU HÔM NAY</span>
          <h2>Duy trì chuỗi học tập</h2>
          <p>Hoàn thành các phần học mỗi ngày để bảo vệ chuỗi streak của bạn.</p>
        </article>

        <article className="sample-card">
          <span className="sample-card__eyebrow">MẸO HỌC NHANH</span>
          <h2>Học từng bước nhỏ</h2>
          <p>Mỗi phần học được thiết kế từ cơ bản đến nâng cao để bạn dễ dàng tiếp thu.</p>
        </article>
      </aside>
    </>
  )
}
