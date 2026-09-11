import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import LessonPath from './LessonPath'
import type { LearningPathLesson } from '../../types/learning-path.types'
import { selectActiveLesson, containerProgressLabel } from '../../utils/learning-path'

const lesson = (overrides: Partial<LearningPathLesson> = {}): LearningPathLesson => ({
  id: 'lesson', name: 'Greetings', description: null, orderIndex: 1,
  requiredScore: 70, questionCount: 2, xpReward: 10, diamondReward: 1,
  progressStatus: 'UNLOCKED', isLocked: false, isCompleted: false,
  bestScore: 0, totalAttempts: 0, ...overrides,
})

describe('curriculum changes', () => {
  it('renders Bài mới and permits opening a newly published lesson', () => {
    const select = vi.fn()
    render(<LessonPath lessons={[lesson({ isNewForUser: true })]} onSelectLesson={select} />)
    expect(screen.getByText('Bài mới')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /Greetings/ }))
    expect(select).toHaveBeenCalledOnce()
  })
  it('preserves completion, shows new content and the review CTA', () => {
    const start = vi.fn()
    render(<LessonPath lessons={[lesson({ isCompleted: true, hasNewContent: true, hasAccess: true })]}
      onSelectLesson={vi.fn()} selectedLessonId="lesson" onStartLesson={start} onDismissLesson={vi.fn()} />)
    expect(screen.getByText('Đã hoàn thành · Có nội dung mới')).toBeVisible()
    expect(screen.getByRole('button', { name: /Greetings/ })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Ôn nội dung mới' }))
    expect(start).toHaveBeenCalledOnce()
  })
  it('prioritizes accessible new lessons, then incomplete current versions, then progress and fallback', () => {
    const completed = lesson({ id: 'done', isCompleted: true, isCurrentVersionCompleted: true })
    const updated = lesson({ id: 'updated', isCompleted: true, isCurrentVersionCompleted: false })
    const fresh = lesson({ id: 'new', isNewForUser: true })
    const locked = lesson({ id: 'locked', isLocked: true, isNewForUser: true })
    expect(selectActiveLesson([completed, updated, locked, fresh])?.id).toBe('new')
    expect(selectActiveLesson([completed, updated, locked])?.id).toBe('updated')
    expect(selectActiveLesson([completed, { ...completed, id: 'progress', progressStatus: 'IN_PROGRESS' }])?.id).toBe('progress')
    expect(selectActiveLesson([completed])?.id).toBe('done')
    expect(selectActiveLesson([])).toBeUndefined()
  })
  it('uses the historic milestone in topic/section labels', () => {
    expect(containerProgressLabel({ isCompleted: true, hasNewContent: true, newLessonCount: 1, progressStatus: 'COMPLETED' }))
      .toBe('Đã hoàn thành trước đây · Có 1 bài mới')
    expect(containerProgressLabel({ isCompleted: false, progressStatus: 'IN_PROGRESS' })).toBe('Đang học')
  })
  it('lets a section show only one recommendation across multiple topic paths', () => {
    render(<>
      <LessonPath lessons={[lesson({ id: 'first' })]} startBadgeLessonId="second" onSelectLesson={vi.fn()} />
      <LessonPath lessons={[lesson({ id: 'second', progressStatus: 'IN_PROGRESS' })]} startBadgeLessonId="second" onSelectLesson={vi.fn()} />
    </>)
    expect(screen.queryByText('Bắt đầu')).not.toBeInTheDocument()
    expect(screen.getAllByText('Tiếp tục')).toHaveLength(1)
  })
  it('uses a review label when the recommended lesson has new content', () => {
    render(<LessonPath lessons={[lesson({ isCompleted: true, hasNewContent: true })]} onSelectLesson={vi.fn()} />)
    expect(screen.getByText('Ôn mới')).toBeVisible()
  })
})
