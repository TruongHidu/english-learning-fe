import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { normalizeApiError } from '../../api/api-error'
import { learningService } from '../../services/learning.service'
import type { StartLessonData, SubmitAnswerResult } from '../../types/learning.types'
import type { UserCourseSectionResponse } from '../../types/course.types'
import type { LearningPathLesson } from '../../types/learning-path.types'
import { getStartLessonErrorMessage } from '../../utils/learning-errors'
import { useAuth } from '../../hooks/useAuth'

import LessonProgressBar from '../../components/lesson/LessonProgressBar'
import QuestionContent from '../../components/lesson/QuestionContent'
import CheckFooter, { type CheckFooterState } from '../../components/lesson/CheckFooter'
import GameOverModal from '../../components/lesson/GameOverModal'
import ExitLessonModal from '../../components/lesson/ExitLessonModal'
import LessonComplete from '../../components/lesson/LessonComplete'
import MultipleChoiceQuestion from '../../components/lesson/MultipleChoiceQuestion'
import MatchingQuestion from '../../components/lesson/MatchingQuestion'
import FillBlankQuestion from '../../components/lesson/FillBlankQuestion'
import '../../components/lesson/LessonQuiz.css'

interface StartLessonLocationState {
  lesson?: LearningPathLesson
  courseId?: string
  sectionId?: string
  section?: Pick<UserCourseSectionResponse, 'name' | 'description'>
}

export default function StartLessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { updateCachedUser } = useAuth()
  const {
    lesson: initialLesson,
    courseId,
    sectionId,
    section,
  } = (location.state ?? {}) as StartLessonLocationState
  
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [learningData, setLearningData] = useState<StartLessonData | null>(null)
  
  // Quiz State
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[] | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkResult, setCheckResult] = useState<SubmitAnswerResult | null>(null)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false)

  // Use a ref for AudioContext to avoid creating it multiple times
  const audioCtxRef = useRef<AudioContext | null>(null)

  const lesson = learningData?.lesson ?? initialLesson
  const totalQuestions = learningData?.progress.totalQuestions ?? lesson?.questionCount ?? 0
  const currentQuestionIndex = learningData?.progress.currentQuestionIndex ?? 0
  const question = learningData?.questions[currentQuestionIndex] ?? null

  // Sound effect for correct answer
  useEffect(() => {
    if (checkResult?.isCorrect) {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        const ctx = audioCtxRef.current
        if (ctx.state === 'suspended') ctx.resume()
        
        const osc = ctx.createOscillator()
        const gainNode = ctx.createGain()
        
        osc.type = 'sine'
        osc.frequency.setValueAtTime(800, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1)
        
        gainNode.gain.setValueAtTime(0.5, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        
        osc.connect(gainNode)
        gainNode.connect(ctx.destination)
        
        osc.start()
        osc.stop(ctx.currentTime + 0.3)
      } catch (err) {
        console.error('Audio playback failed', err)
      }
    }
  }, [checkResult])

  async function handleStart() {
    if (!lessonId || isStarting) return
    if (initialLesson?.isLocked) {
      setStartError('Bạn cần hoàn thành bài học trước để mở bài học này.')
      return
    }
    setIsStarting(true)
    setStartError(null)

    try {
      const nextLearningData = await learningService.startLesson(lessonId)
      setLearningData(nextLearningData)
      updateCachedUser({
        stats: {
          currentHeart: nextLearningData.hearts.current,
          maxHeart: nextLearningData.hearts.max,
        },
      })
      // Reset quiz state
      setSelectedAnswer(null)
      setCheckResult(null)
      setIsGameOver(false)
      setIsComplete(false)
    } catch (error) {
      const apiError = normalizeApiError(error)
      const message = getStartLessonErrorMessage(apiError)

      if (
        (apiError.code === 'SECTION_LOCKED' || apiError.code === 'LESSON_LOCKED') &&
        courseId &&
        sectionId
      ) {
        navigate(`/learn/courses/${courseId}/sections/${sectionId}`, {
          replace: true,
          state: { section, notice: message },
        })
        return
      }

      setStartError(message)
    } finally {
      setIsStarting(false)
    }
  }

  async function handleCheck() {
    const submittedAnswer =
      typeof selectedAnswer === 'string' ? selectedAnswer.trim() : selectedAnswer

    if (
      !submittedAnswer ||
      isSubmitting ||
      !learningData ||
      !question
    ) return

    setIsSubmitting(true)
    try {
      const result = await learningService.submitAnswer(learningData.session.id, {
        questionId: question.id,
        answer: submittedAnswer,
      })

      updateCachedUser({
        stats: { currentHeart: result.heartsRemaining },
      })

      setCheckResult(result)
      
      // Update local state with API results (from SubmitAnswerResult)
      setLearningData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          hearts: {
            ...prev.hearts,
            current: result.heartsRemaining, // Updated from API
          },
          session: {
            ...prev.session,
            heartRemaining: result.heartsRemaining,
            correctCount: result.correctCount,
            wrongCount: result.wrongCount,
            status: result.sessionStatus,
          }
        }
      })
    } catch (error) {
      const apiError = normalizeApiError(error)
      console.error(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleContinue() {
    if (!learningData || !checkResult) return

    if (checkResult.sessionStatus === 'FAILED' || learningData.hearts.current === 0) {
      setIsGameOver(true)
      return
    }

    const nextIndex = currentQuestionIndex + 1
    if (nextIndex >= totalQuestions || checkResult.sessionStatus === 'COMPLETED') {
      setIsComplete(true)
      return
    }

    // Move to next question
    setLearningData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        progress: {
          ...prev.progress,
          currentQuestionIndex: nextIndex,
        }
      }
    })
    
    // Reset selection
    setSelectedAnswer(null)
    setCheckResult(null)
  }

  // Derive footer state
  let footerState: CheckFooterState = 'idle'
  if (isSubmitting) footerState = 'loading'
  else if (checkResult) footerState = checkResult.isCorrect ? 'correct' : 'incorrect'

  // ---------------------------------------------------------------------------
  // Render: Complete
  // ---------------------------------------------------------------------------
  if (isComplete && learningData) {
    return <LessonComplete session={learningData.session} courseId={courseId} sectionId={sectionId} />
  }

  // ---------------------------------------------------------------------------
  // Render: Quiz
  // ---------------------------------------------------------------------------
  if (learningData) {
    const backUrl = courseId && sectionId 
      ? `/learn/courses/${courseId}/sections/${sectionId}` 
      : '/learn'

    return (
      <>
        <main className="lesson-quiz-page mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col px-4 py-8 pb-32 md:px-8" aria-live="polite">
          <LessonProgressBar
            current={currentQuestionIndex + 1}
            total={totalQuestions}
            hearts={learningData.hearts.current}
            maxHearts={learningData.hearts.max}
            backUrl={backUrl}
            onRequestExit={() => setIsExitConfirmOpen(true)}
          />

          {question ? (
            <div className="flex-1">
              <QuestionContent question={question} />

              {/* Multiple Choice Component */}
              {question.type === 'MULTIPLE_CHOICE' && (
                <MultipleChoiceQuestion
                  question={question}
                  selectedAnswer={typeof selectedAnswer === 'string' ? selectedAnswer : null}
                  isSubmitting={isSubmitting}
                  checkResult={checkResult ? { isCorrect: checkResult.isCorrect } : null}
                  onSelect={setSelectedAnswer}
                />
              )}

              {/* Matching Component */}
              {question.type === 'MATCHING' && (
                <MatchingQuestion
                  question={question}
                  disabled={isSubmitting || checkResult !== null}
                  onComplete={setSelectedAnswer}
                />
              )}

              {/* Fill in the blank */}
              {question.type === 'FILL_BLANK' && (
                <FillBlankQuestion
                  question={question}
                  answer={typeof selectedAnswer === 'string' ? selectedAnswer : ''}
                  disabled={isSubmitting || checkResult !== null}
                  checkResult={checkResult}
                  onChange={setSelectedAnswer}
                  onSubmit={() => void handleCheck()}
                />
              )}
              
              {/* Other types placeholders */}
              {question.type !== 'MULTIPLE_CHOICE' &&
                question.type !== 'MATCHING' &&
                question.type !== 'FILL_BLANK' && (
                <div className="lesson-alert lesson-alert--warning mt-6 flex-1 rounded-xl p-6 text-center text-sm font-bold">
                  Loại câu hỏi này ({question.type}) chưa được hỗ trợ hiển thị.
                </div>
              )}
            </div>
          ) : (
            <div className="lesson-alert lesson-alert--warning flex-1 rounded-xl p-6 text-center text-sm font-bold">
              Bài học chưa có câu hỏi khả dụng. Vui lòng quay lại và thử lại sau.
            </div>
          )}
        </main>

        {question && (
          <CheckFooter
            state={footerState}
            isDisabled={
              typeof selectedAnswer === 'string'
                ? selectedAnswer.trim().length === 0
                : !selectedAnswer
            }
            correctAnswer={typeof checkResult?.correctAnswer === 'string' ? checkResult.correctAnswer : Array.isArray(checkResult?.correctAnswer) ? checkResult.correctAnswer.join(', ') : undefined}
            explanation={checkResult?.explanation}
            onCheck={() => void handleCheck()}
            onContinue={handleContinue}
          />
        )}

        <GameOverModal
          isOpen={isGameOver}
          courseId={courseId}
          sectionId={sectionId}
          onRetry={() => void handleStart()}
        />

        <ExitLessonModal
          isOpen={isExitConfirmOpen}
          onContinue={() => setIsExitConfirmOpen(false)}
          onExit={() => navigate(backUrl)}
        />
      </>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: Start Screen
  // ---------------------------------------------------------------------------
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 md:px-8">
      <section className="learning-surface learning-surface--raised rounded-2xl border-2 p-6 md:p-9">
        <button type="button" onClick={() => navigate(-1)} className="learning-back-action mb-7 rounded-xl px-3 py-2 text-sm font-black focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sky-400">← Quay lại</button>
        <p className="mb-2 text-xs font-black uppercase tracking-widest text-emerald-600">Bài học mới</p>
        <h1 className="learning-heading-color mb-3 text-3xl font-black">{lesson?.name ?? 'Sẵn sàng bắt đầu?'}</h1>
        <p className="learning-muted-color mb-7 text-sm leading-relaxed">{lesson?.description ?? 'Hãy sẵn sàng trả lời câu hỏi và chinh phục bài học này.'}</p>

        <dl className="mb-8 grid grid-cols-2 gap-3">
          <div className="lesson-start-stat lesson-start-stat--score rounded-xl p-4"><dt className="text-xs font-black uppercase tracking-wider">Cần đạt</dt><dd className="mt-1 text-2xl font-black">{lesson?.requiredScore ?? '—'}{lesson ? '%' : ''}</dd></div>
          <div className="lesson-start-stat lesson-start-stat--questions rounded-xl p-4"><dt className="text-xs font-black uppercase tracking-wider">Câu hỏi</dt><dd className="mt-1 text-2xl font-black">{lesson?.questionCount ?? '—'}</dd></div>
        </dl>

        {startError && <div className="lesson-alert lesson-alert--error mb-5 rounded-xl p-4 text-sm font-bold" role="alert">{startError}</div>}
        <button type="button" disabled={!lessonId || isStarting || initialLesson?.isLocked} onClick={() => void handleStart()} className="lesson-primary-action w-full rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-[0_4px_0_#047857] transition-all hover:bg-emerald-600 active:translate-y-1 active:shadow-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
          {initialLesson?.isLocked
            ? 'Bài học đang khóa'
            : isStarting
              ? 'Đang bắt đầu...'
              : 'Bắt đầu học'}
        </button>
        {startError && <button type="button" onClick={() => void handleStart()} disabled={isStarting} className="lesson-retry-action mt-4 w-full text-sm font-black text-emerald-600 underline underline-offset-4">Thử lại</button>}
      </section>
    </main>
  )
}
