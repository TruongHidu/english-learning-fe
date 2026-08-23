import type { LearningPathLesson } from '../../types/learning-path.types'

interface LessonStartPopoverProps {
  lesson: LearningPathLesson
  lessonIndex: number
  totalLessons: number
  onStart: (lesson: LearningPathLesson) => void
  onDismiss: () => void
  onViewVocab?: (lesson: LearningPathLesson) => void
}

export default function LessonStartPopover({
  lesson,
  lessonIndex,
  totalLessons,
  onStart,
  onDismiss,
  onViewVocab,
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
          <div className="flex flex-col gap-2 w-full">
            <button type="button" onClick={() => onStart(lesson)}>
              {lesson.isCompleted ? 'Học lại' : `Bắt đầu +${lesson.xpReward} KN`}
            </button>
            {onViewVocab && (
              <button
                type="button"
                onClick={() => onViewVocab(lesson)}
                className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-white/40 bg-white/20 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-white/30 backdrop-blur-md transition-all active:scale-95"
              >
                📖 Từ vựng bài học
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
