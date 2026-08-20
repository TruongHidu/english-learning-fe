import { useNavigate } from 'react-router-dom'
import type { UserCourseSectionResponse } from '../../types/course.types'

interface SectionCardProps {
  courseId: string
  section: UserCourseSectionResponse
}

export default function SectionCard({ courseId, section }: SectionCardProps) {
  const navigate = useNavigate()
  const statusLabel = section.isLocked
    ? section.isCompleted
      ? 'Đã học · Hiện bị khóa'
      : 'Chưa mở khóa'
    : section.isCompleted
      ? 'Đã hoàn thành'
      : section.progressStatus === 'IN_PROGRESS'
        ? 'Đang học'
        : 'Sẵn sàng học'

  const openSection = () => {
    if (section.isLocked) return
    navigate(`/learn/courses/${courseId}/sections/${section.id}`, {
      state: { section },
    })
  }

  return (
    <article
      className={`learning-surface learning-surface--raised rounded-2xl p-5 border-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        section.isLocked ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center font-black text-lg shrink-0">
          {section.isLocked ? '🔒' : section.isCompleted ? '✓' : section.orderIndex}
        </div>
        <div>
          <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider block mb-0.5">
            PHẦN {section.orderIndex}
          </span>
          <h3 className="learning-heading-color text-base md:text-lg font-extrabold mb-1">
            {section.name}
          </h3>
          {section.description ? (
            <p className="learning-muted-color text-sm leading-relaxed">
              {section.description}
            </p>
          ) : (
            <p className="learning-subtle-color text-sm italic">Chưa có mô tả chi tiết.</p>
          )}
          <div className="learning-muted-color mt-3 flex flex-wrap items-center gap-2 text-xs font-extrabold">
            <span>{statusLabel}</span>
            <span aria-hidden="true">•</span>
            <span>
              {section.completedLessonCount}/{section.totalLessonCount} bài học
            </span>
          </div>
        </div>
      </div>

      <div className="w-full md:w-auto shrink-0">
        <button
          type="button"
          onClick={section.isLocked ? undefined : openSection}
          disabled={section.isLocked}
          className="w-full md:w-auto px-5 py-2.5 rounded-xl font-extrabold text-xs text-white bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 shadow-[0_4px_0_#047857] active:translate-y-1 active:shadow-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 transition-all cursor-pointer uppercase tracking-wider text-center flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:border-[var(--surface-border)] disabled:bg-[var(--surface-soft-bg)] disabled:text-[var(--muted-color)] disabled:shadow-[0_4px_0_var(--surface-shadow)]"
          title={
            section.isLocked
              ? 'Bạn cần hoàn thành tất cả bài học trong phần học trước.'
              : `Mở ${section.name}`
          }
        >
          <span>{section.isLocked ? '🔒' : section.isCompleted ? '✓' : '▶'}</span>
          <span>{section.isLocked ? 'Đã khóa' : 'Xem lộ trình'}</span>
        </button>
      </div>
    </article>
  )
}
