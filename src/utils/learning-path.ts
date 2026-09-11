import type { LearningPathLesson, ProgressStatus } from '../types/learning-path.types'

export function selectActiveLesson(lessons: LearningPathLesson[]): LearningPathLesson | undefined {
  const available = lessons.filter(lesson => !lesson.isLocked)
  return available.find(lesson => lesson.isNewForUser)
    ?? available.find(lesson => !(lesson.isCurrentVersionCompleted ?? lesson.isCompleted))
    ?? available.find(lesson => lesson.progressStatus === 'IN_PROGRESS')
    ?? lessons[0]
}

export function containerProgressLabel(container: {
  isCompleted: boolean
  hasNewContent?: boolean
  newLessonCount?: number
  progressStatus: ProgressStatus
}): string {
  if (container.isCompleted && container.hasNewContent) {
    return container.newLessonCount
      ? `Đã hoàn thành trước đây · Có ${container.newLessonCount} bài mới`
      : 'Đã hoàn thành trước đây · Có nội dung mới'
  }
  if (container.isCompleted) return 'Đã hoàn thành'
  if (container.progressStatus === 'LOCKED') return 'Đang khóa'
  if (container.progressStatus === 'IN_PROGRESS') return 'Đang học'
  return 'Sẵn sàng học'
}
