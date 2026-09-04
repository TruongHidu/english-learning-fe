import { useNavigate } from 'react-router-dom'
import type { UserCourseSectionResponse } from '../../types/course.types'

interface SectionCardProps {
  courseId: string
  section: UserCourseSectionResponse
}

interface SectionBuddyProps {
  isCompleted: boolean
  isLocked: boolean
}

function SectionBuddy({ isCompleted, isLocked }: SectionBuddyProps) {
  const bodyColor = isLocked ? '#7b8790' : isCompleted ? '#58cc02' : '#1cb0f6'
  const bodyShade = isLocked ? '#5f6970' : isCompleted ? '#46a302' : '#168ec7'

  return (
    <svg
      className="course-section-card__buddy"
      viewBox="0 0 190 170"
      role="img"
      aria-label={isLocked ? 'Phần học đang bị khóa' : 'Linh vật chào mừng bạn học'}
    >
      <ellipse cx="96" cy="148" rx="58" ry="14" fill="rgb(15 23 42 / 28%)" />
      <path
        d="M43 83c0-34 21-58 53-58s53 24 53 58v28c0 29-23 47-53 47s-53-18-53-47V83Z"
        fill={bodyShade}
      />
      <path
        d="M43 83 24 95l24 7m101-19 18 12-23 7M58 43 41 27l5 30m88-14 17-16-5 30"
        fill={bodyColor}
        stroke={bodyColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="10"
      />
      <ellipse cx="96" cy="91" rx="50" ry="57" fill={bodyColor} />
      <ellipse cx="75" cy="76" rx="24" ry="29" fill="#f7f4e8" />
      <ellipse cx="117" cy="76" rx="24" ry="29" fill="#f7f4e8" />
      {isLocked ? (
        <>
          <path d="M64 78h20M107 78h20" fill="none" stroke="#35414a" strokeLinecap="round" strokeWidth="6" />
          <rect x="80" y="104" width="32" height="28" rx="7" fill="#45515a" />
          <path d="M87 104v-7a9 9 0 0 1 18 0v7" fill="none" stroke="#e7edf0" strokeWidth="5" />
          <circle cx="96" cy="117" r="3" fill="#e7edf0" />
        </>
      ) : (
        <>
          <ellipse cx="75" cy="78" rx="10" ry="16" fill="#25313a" />
          <ellipse cx="117" cy="78" rx="10" ry="16" fill="#25313a" />
          <circle cx="79" cy="72" r="4" fill="#fff" />
          <circle cx="121" cy="72" r="4" fill="#fff" />
          <path d="m96 86-11 8 11 8 11-8-11-8Z" fill="#ffb100" />
          <path d="M71 119c15 11 35 11 50 0" fill="none" stroke="#f7f4e8" strokeLinecap="round" strokeWidth="9" />
        </>
      )}
    </svg>
  )
}

export default function SectionCard({ courseId, section }: SectionCardProps) {
  const navigate = useNavigate()
  const displayOrder = section.orderIndex + 1
  const progressPercent = section.totalLessonCount > 0
    ? Math.round((section.completedLessonCount / section.totalLessonCount) * 100)
    : section.isCompleted
      ? 100
      : 0
  const safeProgressPercent = Math.min(100, Math.max(0, progressPercent))

  const statusLabel = section.isCompleted
    ? 'Đã hoàn thành'
    : section.progressStatus === 'IN_PROGRESS'
      ? 'Đang học'
      : 'Sẵn sàng học'

  const actionLabel = section.isLocked
    ? 'Chưa mở khóa'
    : section.isCompleted
      ? 'Xem lại phần học'
      : section.progressStatus === 'IN_PROGRESS'
        ? 'Tiếp tục'
        : 'Bắt đầu'

  const message = section.isLocked
    ? 'Hoàn thành tất cả bài học trong phần trước để mở khóa nhé!'
    : section.isCompleted
      ? 'Tuyệt vời! Bạn đã hoàn thành phần học này.'
      : section.description?.trim() || `Cùng khám phá “${section.name}” nhé!`

  const openSection = () => {
    if (section.isLocked) return
    navigate(`/learn/courses/${courseId}/sections/${section.id}`, {
      state: { section },
    })
  }

  return (
    <article
      className={`course-section-card${section.isLocked ? ' course-section-card--locked' : ''}${section.isCompleted ? ' course-section-card--completed' : ''}`}
      aria-label={`Phần ${displayOrder}: ${section.name}${section.isLocked ? ', đang khóa' : ''}`}
    >
      <div className="course-section-card__content">
        <div>
          <span className="course-section-card__eyebrow">PHẦN {displayOrder}</span>
          <h3 className="course-section-card__title">{section.name}</h3>
        </div>

        {section.isLocked ? (
          <div className="course-section-card__locked-status" role="status">
            <span className="course-section-card__lock-icon" aria-hidden="true">🔒</span>
            <span>Chưa mở khóa</span>
            <span aria-hidden="true">•</span>
            <span>{section.totalLessonCount} bài học</span>
          </div>
        ) : (
          <div className="course-section-card__progress-wrap">
            <div
              className="course-section-card__progress"
              role="progressbar"
              aria-label={`Đã hoàn thành ${safeProgressPercent}%`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={safeProgressPercent}
            >
              <div
                className="course-section-card__progress-value"
                style={{ width: `${safeProgressPercent}%` }}
              />
              <strong>{safeProgressPercent}%</strong>
            </div>
            <span className="course-section-card__trophy" aria-hidden="true">
              {section.isCompleted ? '🏆' : '🏅'}
            </span>
          </div>
        )}

        <div className="course-section-card__meta">
          <span>{section.isLocked ? 'Đang khóa' : statusLabel}</span>
          <span aria-hidden="true">•</span>
          <span>{section.completedLessonCount}/{section.totalLessonCount} bài học</span>
        </div>

        <button
          type="button"
          onClick={openSection}
          disabled={section.isLocked}
          className="course-section-card__action"
          title={
            section.isLocked
              ? 'Bạn cần hoàn thành tất cả bài học trong phần học trước.'
              : `Mở ${section.name}`
          }
        >
          <span>{section.isLocked ? '🔒' : section.isCompleted ? '✓' : '▶'}</span>
          <span>{actionLabel}</span>
        </button>
      </div>

      <div className="course-section-card__visual">
        <div className="course-section-card__message">{message}</div>
        <SectionBuddy isCompleted={section.isCompleted} isLocked={section.isLocked} />
      </div>
    </article>
  )
}
