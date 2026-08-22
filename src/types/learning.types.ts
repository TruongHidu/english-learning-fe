import type { ApiSuccess } from './api.types'
import type { QuestionType } from './question.types'

export interface LearningQuestionOption {
  id: string | null
  content: string
  imageUrl: string | null
  orderIndex: number
}

export interface LearningQuestion {
  id: string
  type: QuestionType
  content: string
  instruction: string | null
  options: LearningQuestionOption[] | null
  matchingLeftItems: string[] | null
  matchingRightItems: string[] | null
  audioUrl: string | null
  imageUrl: string | null
}

export interface LearningSession {
  id: string
  lessonId: string
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ABANDONED'
  heartStart: number
  heartRemaining: number
  totalQuestions: number
  correctCount: number
  wrongCount: number
  score: number
  startedAt: string
}

export interface StartLessonData {
  session: LearningSession
  lesson: {
    id: string
    name: string
    description: string | null
    requiredScore: number
    questionCount: number
  }
  progress: {
    currentQuestionIndex: number
    totalQuestions: number
  }
  hearts: {
    current: number
    max: number
    nextHeartAt?: string | null
  }
  questions: LearningQuestion[]
}

export type StartLessonResponse = ApiSuccess<StartLessonData>

export interface SubmitAnswerPayload {
  questionId: string
  answer: string | string[]
}

export interface SubmitAnswerResult {
  isCorrect: boolean
  correctAnswer?: unknown
  explanation?: string | null
  heartsRemaining: number
  nextHeartAt?: string | null
  sessionStatus: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ABANDONED'
  correctCount: number
  wrongCount: number
}

export type SubmitAnswerResponse = ApiSuccess<SubmitAnswerResult>
