import type { CSSProperties } from 'react'
import type { CourseResponse } from '../../types/course.types'

interface CourseCardProps {
  course: CourseResponse
  onSelect: (course: CourseResponse) => void
}

/** Each CEFR level gets its own colour pair and mascot emoji. */
const levelThemes: Record<string, { from: string; to: string; emoji: string }> = {
  A1: { from: '#58cc02', to: '#2dbb6e', emoji: '🌱' },
  A2: { from: '#1cb0f6', to: '#2dbb9a', emoji: '🚀' },
  B1: { from: '#a855f7', to: '#1cb0f6', emoji: '🧭' },
  B2: { from: '#ff9600', to: '#ff4b8b', emoji: '🔥' },
  C1: { from: '#ff4b4b', to: '#a855f7', emoji: '🏆' },
  C2: { from: '#1f2937', to: '#a855f7', emoji: '👑' },
}

const fallbackTheme = { from: '#58cc02', to: '#1cb0f6', emoji: '🎓' }

export default function CourseCard({ course, onSelect }: CourseCardProps) {
  const theme = levelThemes[course.level?.toUpperCase()] ?? fallbackTheme

  return (
    <article
      className="course-card learning-surface hover-lift"
      style={{ '--course-from': theme.from, '--course-to': theme.to } as CSSProperties}
    >
      <div className="course-card__cover">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.name}
            className="course-card__image"
            onError={(e) => {
              // Fallback to the gradient cover if the image is broken
              (e.target as HTMLElement).style.display = 'none'
            }}
          />
        ) : null}
        <span className="course-card__emoji" aria-hidden="true">{theme.emoji}</span>
        <span className="course-card__level">{course.level}</span>
        <span className="course-card__order">Khóa #{course.orderIndex}</span>
      </div>

      <div className="course-card__body">
        <h3 className="course-card__title">{course.name}</h3>

        {course.description ? (
          <p className="course-card__desc">{course.description}</p>
        ) : (
          <p className="course-card__desc course-card__desc--empty">Chưa có mô tả chi tiết.</p>
        )}

        <button type="button" onClick={() => onSelect(course)} className="course-card__action btn-shine">
          <span>Xem các phần học</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-6 6 6-6 6" /></svg>
        </button>
      </div>
    </article>
  )
}
