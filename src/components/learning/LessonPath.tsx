import type { LearningPathLesson } from '../../types/learning-path.types'
import LessonStartPopover from './LessonStartPopover'
import './LessonPath.css'

interface LessonPathProps {
  lessons: LearningPathLesson[]
  onSelectLesson: (lesson: LearningPathLesson) => void
  selectedLessonId?: string | null
  onStartLesson?: (lesson: LearningPathLesson) => void
  onDismissLesson?: () => void
}

function getLessonStatusLabel(lesson: LearningPathLesson): string {
  if (lesson.isLocked && lesson.isCompleted) return 'Đã hoàn thành trước đây · Hiện bị khóa'
  if (lesson.isLocked) return 'Chưa mở khóa'
  if (lesson.isCompleted) return 'Đã hoàn thành'
  if (lesson.progressStatus === 'IN_PROGRESS') return 'Đang học'
  return 'Sẵn sàng học'
}

function getNodeModifier(lesson: LearningPathLesson): string {
  if (lesson.isLocked) return 'lesson-path-node--locked'
  if (lesson.isCompleted) return 'lesson-path-node--completed'
  if (lesson.progressStatus === 'IN_PROGRESS') return 'lesson-path-node--current'
  return 'lesson-path-node--unlocked'
}

function LessonIcon({ lesson }: { lesson: LearningPathLesson }) {
  if (lesson.isLocked) return <span aria-hidden="true">🔒</span>
  if (lesson.isCompleted) return <span aria-hidden="true">✓</span>
  if (lesson.progressStatus === 'IN_PROGRESS') return <span aria-hidden="true">▶</span>
  return <span aria-hidden="true">★</span>
}

export default function LessonPath({
  lessons,
  onSelectLesson,
  selectedLessonId = null,
  onStartLesson,
  onDismissLesson,
}: LessonPathProps) {
  if (lessons.length === 0) {
    return (
      <div className="learning-surface learning-surface--raised lesson-path-empty">
        Topic này chưa có bài học được phát hành.
      </div>
    )
  }

  const firstActionableLessonId = lessons.find(
    (lesson) => !lesson.isLocked && !lesson.isCompleted,
  )?.id

  return (
    <ol className="lesson-path-list" aria-label="Danh sách bài học">
      {lessons.map((lesson, index) => {
        const alignLeft = index % 2 === 0
        const statusLabel = getLessonStatusLabel(lesson)

        return (
          <li
            key={lesson.id}
            data-lesson-id={lesson.id}
            className={`lesson-path-item ${
              alignLeft ? 'lesson-path-item--left' : 'lesson-path-item--right'
            }`}
          >
            {index > 0 ? <span className="lesson-path-connector" aria-hidden="true" /> : null}

            <div className="lesson-path-node-wrap">
              {lesson.id === firstActionableLessonId ? (
                <span className="lesson-path-start-badge">Bắt đầu</span>
              ) : null}
              <button
                type="button"
                className={`lesson-path-node ${getNodeModifier(lesson)}`}
                disabled={lesson.isLocked}
                onClick={
                  lesson.isLocked ? undefined : () => onSelectLesson(lesson)
                }
                aria-label={`${lesson.name}: ${statusLabel}`}
                title={
                  lesson.isLocked
                    ? 'Bạn cần hoàn thành bài học trước để mở bài học này.'
                    : `Mở ${lesson.name}`
                }
              >
                <LessonIcon lesson={lesson} />
              </button>
              {lesson.isLocked && lesson.isCompleted ? (
                <span className="lesson-path-completed-mark" title="Bạn từng hoàn thành bài học này">
                  ✓
                </span>
              ) : null}
            </div>

            <article className="learning-surface lesson-path-card">
              <span className="lesson-path-index">Bài {index + 1}</span>
              <h3>{lesson.name}</h3>
              <p>{lesson.description ?? `${lesson.questionCount} câu hỏi`}</p>
              <span className="lesson-path-status">{statusLabel}</span>
              {lesson.isCompleted || lesson.totalAttempts > 0 ? (
                <span className="lesson-path-score">
                  Điểm cao nhất: {lesson.bestScore}% · {lesson.totalAttempts} lượt
                </span>
              ) : (
                <span className="lesson-path-score">
                  +{lesson.xpReward} XP · +{lesson.diamondReward} kim cương
                </span>
              )}
            </article>

            {selectedLessonId === lesson.id && onStartLesson && onDismissLesson ? (
              <LessonStartPopover
                lesson={lesson}
                lessonIndex={index}
                totalLessons={lessons.length}
                onStart={onStartLesson}
                onDismiss={onDismissLesson}
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
