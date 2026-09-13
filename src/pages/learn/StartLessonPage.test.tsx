import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import StartLessonPage from './StartLessonPage'
import type { StartLessonData, SubmitAnswerResult } from '../../types/learning.types'

const mocks = vi.hoisted(() => ({ start: vi.fn(), submit: vi.fn(), updateUser: vi.fn() }))
vi.mock('../../services/learning.service', () => ({ learningService: { startLesson: mocks.start, submitAnswer: mocks.submit } }))
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: { stats: { diamond: 0 } }, updateCachedUser: mocks.updateUser }) }))
vi.mock('../../components/lesson/GameOverModal', () => ({ default: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div>Game over</div> : null }))
vi.mock('../../components/lesson/LessonComplete', () => ({ default: () => <div>Kết quả bài học</div> }))

const data: StartLessonData = {
  session: { id: 's1', lessonId: 'l1', status: 'IN_PROGRESS', heartStart: 5, heartRemaining: 5,
    totalQuestions: 2, correctCount: 0, wrongCount: 0, score: 0, startedAt: '' },
  lesson: { id: 'l1', name: 'Dịch câu', description: null, requiredScore: 80, questionCount: 2 },
  progress: { currentQuestionIndex: 0, totalQuestions: 2 },
  hearts: { current: 5, max: 5, nextHeartAt: null },
  questions: ['Hello', 'Goodbye'].map((content, index) => ({ id: `q${index}`, type: 'TRANSLATION', content,
    instruction: null, options: null, matchingLeftItems: null, matchingRightItems: null, audioUrl: null, imageUrl: null })),
}
const fallback: SubmitAnswerResult = {
  isCorrect: false, gradingStatus: 'AI_UNAVAILABLE_FALLBACK', heartDeducted: false,
  correctAnswer: 'Xin chào', heartsRemaining: 5, nextHeartAt: null, sessionStatus: 'IN_PROGRESS',
  correctCount: 0, wrongCount: 1, score: 0, rewards: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.start.mockResolvedValue(structuredClone(data))
  mocks.submit.mockResolvedValue(fallback)
})

async function answer() {
  render(<MemoryRouter initialEntries={['/learn/l1']}><Routes>
    <Route path="/learn/:lessonId" element={<StartLessonPage />} />
  </Routes></MemoryRouter>)
  fireEvent.change(await screen.findByRole('textbox', { name: 'Bản dịch của bạn' }), { target: { value: 'Chào bạn' } })
  fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
  await screen.findByText('Sai rồi')
}

it('fallback shows the answer, preserves hearts and continues to the next question', async () => {
  await answer()
  expect(screen.getByText('Xin chào')).toBeInTheDocument()
  expect(screen.getByText(/AI chấm dịch đang tạm gián đoạn/)).toBeInTheDocument()
  expect(screen.getByLabelText('5 trái tim')).toBeInTheDocument()
  expect(mocks.updateUser).toHaveBeenLastCalledWith({ stats: { currentHeart: 5, nextHeartAt: null } })
  expect(screen.queryByText('Game over')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }))
  await screen.findByText('Goodbye')
  expect(screen.getByRole('textbox', { name: 'Bản dịch của bạn' })).toHaveValue('')
  expect(mocks.submit).toHaveBeenCalledTimes(1)
})

it('normal wrong answers update hearts from the server and do not show fallback text', async () => {
  mocks.submit.mockResolvedValue({ ...fallback, gradingStatus: 'NORMAL', heartDeducted: true, heartsRemaining: 4 })
  await answer()
  expect(screen.getByLabelText('4 trái tim')).toBeInTheDocument()
  expect(screen.queryByText(/AI chấm dịch đang tạm gián đoạn/)).not.toBeInTheDocument()
})

it('a final fallback completes the result flow instead of opening game over', async () => {
  mocks.submit.mockResolvedValue({ ...fallback, sessionStatus: 'FAILED' })
  await answer()
  fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }))
  await waitFor(() => expect(screen.getByText('Kết quả bài học')).toBeInTheDocument())
  expect(screen.queryByText('Game over')).not.toBeInTheDocument()
})
