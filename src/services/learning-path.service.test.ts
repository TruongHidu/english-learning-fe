import { expect, it, vi } from 'vitest'
import api from '../api/axios'
import { learningPathService } from './learning-path.service'

vi.mock('../api/axios', () => ({ default: { get: vi.fn() } }))

it('preserves additive fields and earned access while mapping the published count', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { data: {
    topic: { id: 'topic' },
    lessons: [{ id: 'lesson', orderIndex: 0, questionCount: 9, publishedQuestionCount: 2,
      hasAccess: true, isLocked: true, isCompleted: true, currentVersion: 3, completedVersion: 2,
      isCurrentVersionCompleted: false, hasNewContent: true }],
  } } })
  const result = await learningPathService.getLessonsByTopic('topic')
  expect(result.lessons[0]).toMatchObject({ questionCount: 2, publishedQuestionCount: 2,
    isLocked: false, hasNewContent: true, currentVersion: 3, completedVersion: 2 })
})
