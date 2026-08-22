import type { LearningPathLesson } from '../../types/learning-path.types'

interface LessonStartPopoverProps {
  lesson: LearningPathLesson
  lessonIndex: number
  totalLessons: number
  onStart: (lesson: LearningPathLesson) => void
  onDismiss: () => void
}

export default function LessonStartPopover({
  lesson,
  lessonIndex,
  totalLessons,
  onStart,
  onDismiss,
}: LessonStartPopoverProps) {
  return (
    <>
      <div
        className="lesson-start-popover-backdrop"
        onClick={onDismiss}
        aria-hidden="true"
      />
      <aside
        className="lesson-start-popover"
        role="dialog"
        aria-modal="true"
        aria-label={`Bắt đầu bài học ${lesson.name}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="lesson-start-popover__illustration" aria-hidden="true">
          🦉
        </div>
        <div className="lesson-start-popover__content">
          <h3>{lesson.name}</h3>
          <p>
            Bài học {lessonIndex + 1} / {totalLessons}
          </p>
          <button type="button" onClick={() => onStart(lesson)}>
            Bắt đầu +{lesson.xpReward} KN
          </button>
        </div>
      </aside>
    </>
  )
}
