import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { normalizeApiError } from '../../api/api-error'
import { learningService } from '../../services/learning.service'
import type { LearningQuestion, StartLessonData } from '../../types/learning.types'
import type { UserCourseSectionResponse } from '../../types/course.types'
import type { LearningPathLesson } from '../../types/learning-path.types'
import { getStartLessonErrorMessage } from '../../utils/learning-errors'

interface StartLessonLocationState {
  lesson?: LearningPathLesson
  courseId?: string
  sectionId?: string
  section?: Pick<UserCourseSectionResponse, 'name' | 'description'>
}

function QuestionPlaceholder({ question }: { question: LearningQuestion }) {
  if (question.type === 'MATCHING') {
    return (
      <div className="grid grid-cols-2 gap-3" aria-label="Khu vực ghép đôi">
        <div className="space-y-2">
          {question.matchingLeftItems?.map((item) => (
            <div key={item} className="learning-surface--soft learning-heading-color rounded-xl border-2 p-3 text-sm font-bold">{item}</div>
          ))}
        </div>
        <div className="space-y-2">
          {question.matchingRightItems?.map((item) => (
            <div key={item} className="learning-surface--soft learning-heading-color rounded-xl border-2 p-3 text-sm font-bold">{item}</div>
          ))}
        </div>
      </div>
    )
  }

  if (question.type === 'FILL_BLANK' || question.type === 'TRANSLATION') {
    return <input disabled className="learning-surface--soft learning-heading-color w-full rounded-xl border-2 px-4 py-3 text-sm" placeholder="Nhập câu trả lời ở bước tiếp theo" />
  }

  if (question.type === 'ORDER_SENTENCE') {
    return <div className="learning-surface--soft learning-muted-color rounded-xl border-2 border-dashed p-5 text-center text-sm font-bold">Khu vực sắp xếp câu sẽ có ở bước tiếp theo.</div>
  }

  return (
    <div className="space-y-3">
      {question.options?.map((option) => (
        <button key={option.id ?? option.orderIndex} type="button" disabled className="learning-surface learning-heading-color w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-bold">
          {option.content}
        </button>
      ))}
    </div>
  )
}

export default function StartLessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    lesson: initialLesson,
    courseId,
    sectionId,
    section,
  } = (location.state ?? {}) as StartLessonLocationState
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [learningData, setLearningData] = useState<StartLessonData | null>(null)

  const lesson = learningData?.lesson ?? initialLesson
  const totalQuestions = learningData?.progress.totalQuestions ?? lesson?.questionCount ?? 0
  const displayCurrentQuestion = learningData ? learningData.progress.currentQuestionIndex + 1 : 0
  const progressPercent = totalQuestions > 0 && learningData
    ? Math.min(100, (displayCurrentQuestion / totalQuestions) * 100)
    : 0
  const question = learningData?.questions[learningData.progress.currentQuestionIndex] ?? null

  async function handleStart() {
    if (!lessonId || isStarting) return
    if (initialLesson?.isLocked) {
      setStartError('Bạn cần hoàn thành bài học trước để mở bài học này.')
      return
    }
    setIsStarting(true)
    setStartError(null)

    try {
      setLearningData(await learningService.startLesson(lessonId))
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

  if (learningData) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8" aria-live="polite">
        <header className="mb-8 flex items-center justify-between gap-4">
          <button type="button" onClick={() => navigate(-1)} className="learning-back-action rounded-xl px-3 py-2 text-sm font-black focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sky-400">← Thoát</button>
          <div className="rounded-xl bg-rose-50 px-4 py-2 font-black text-rose-500">❤️ {learningData.hearts.current} / {learningData.hearts.max}</div>
        </header>

        <section className="learning-surface learning-surface--raised rounded-2xl border-2 p-5 md:p-8">
          <div className="mb-7">
            <div className="learning-muted-color mb-2 flex items-center justify-between gap-4 text-xs font-black uppercase tracking-wider">
              <span>Tiến độ</span>
              <span>{displayCurrentQuestion} / {totalQuestions}</span>
            </div>
            <div className="learning-progress-track h-4 overflow-hidden rounded-full" role="progressbar" aria-valuemin={0} aria-valuemax={totalQuestions} aria-valuenow={displayCurrentQuestion}>
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {question ? (
            <article>
              {question.instruction && <p className="mb-3 text-sm font-black uppercase tracking-wider text-emerald-600">{question.instruction}</p>}
              <h1 className="learning-heading-color mb-6 text-2xl font-black md:text-3xl">{question.content}</h1>
              {question.imageUrl && <img src={question.imageUrl} alt="Minh họa câu hỏi" className="mb-6 max-h-64 rounded-2xl object-cover" />}
              {question.audioUrl && <audio className="mb-6 w-full" controls src={question.audioUrl}>Trình duyệt không hỗ trợ phát âm thanh.</audio>}
              <QuestionPlaceholder question={question} />
              <p className="learning-subtle-color mt-6 text-center text-xs font-bold">Chức năng trả lời sẽ được triển khai ở bước tiếp theo.</p>
            </article>
          ) : (
            <div className="rounded-xl bg-amber-50 p-6 text-center text-sm font-bold text-amber-800">Bài học chưa có câu hỏi khả dụng. Vui lòng quay lại và thử lại sau.</div>
          )}
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 md:px-8">
      <section className="learning-surface learning-surface--raised rounded-2xl border-2 p-6 md:p-9">
        <button type="button" onClick={() => navigate(-1)} className="learning-back-action mb-7 rounded-xl px-3 py-2 text-sm font-black focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sky-400">← Quay lại</button>
        <p className="mb-2 text-xs font-black uppercase tracking-widest text-emerald-600">Bài học mới</p>
        <h1 className="learning-heading-color mb-3 text-3xl font-black">{lesson?.name ?? 'Sẵn sàng bắt đầu?'}</h1>
        <p className="learning-muted-color mb-7 text-sm leading-relaxed">{lesson?.description ?? 'Hãy sẵn sàng trả lời câu hỏi và chinh phục bài học này.'}</p>

        <dl className="mb-8 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-sky-50 p-4"><dt className="text-xs font-black uppercase tracking-wider text-sky-700">Cần đạt</dt><dd className="mt-1 text-2xl font-black text-sky-800">{lesson?.requiredScore ?? '—'}{lesson ? '%' : ''}</dd></div>
          <div className="rounded-xl bg-emerald-50 p-4"><dt className="text-xs font-black uppercase tracking-wider text-emerald-700">Câu hỏi</dt><dd className="mt-1 text-2xl font-black text-emerald-800">{lesson?.questionCount ?? '—'}</dd></div>
        </dl>

        {startError && <div className="mb-5 rounded-xl border-2 border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700" role="alert">{startError}</div>}
        <button type="button" disabled={!lessonId || isStarting || initialLesson?.isLocked} onClick={() => void handleStart()} className="w-full rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-[0_4px_0_#047857] transition-all hover:bg-emerald-600 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
          {initialLesson?.isLocked
            ? 'Bài học đang khóa'
            : isStarting
              ? 'Đang bắt đầu...'
              : 'Bắt đầu học'}
        </button>
        {startError && <button type="button" onClick={() => void handleStart()} disabled={isStarting} className="mt-4 w-full text-sm font-black text-emerald-600 underline underline-offset-4 disabled:text-slate-400">Thử lại</button>}
      </section>
    </main>
  )
}
