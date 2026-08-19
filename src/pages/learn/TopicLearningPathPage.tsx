import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { learningPathService } from '../../services/learning-path.service'
import type { LearningPathLesson, TopicLearningPath } from '../../types/learning-path.types'
import { getLearningPathErrorMessage } from '../../utils/learning-errors'

interface LocationState { sectionId?: string; courseId?: string }

function nodeClass(lesson: LearningPathLesson): string {
  if (lesson.progressStatus === 'COMPLETED') return 'border-emerald-700 bg-emerald-500 text-white shadow-[0_6px_0_#047857]'
  if (lesson.progressStatus === 'IN_PROGRESS') return 'border-sky-700 bg-sky-500 text-white shadow-[0_6px_0_#0369a1]'
  if (lesson.isLocked) return 'border-slate-300 bg-slate-200 text-slate-400 shadow-[0_6px_0_#cbd5e1]'
  return 'border-emerald-700 bg-emerald-500 text-white shadow-[0_6px_0_#047857] hover:bg-emerald-600'
}

function NodeIcon({ status }: { status: LearningPathLesson['progressStatus'] }) {
  if (status === 'COMPLETED') return <span aria-hidden="true">✓</span>
  if (status === 'LOCKED') return <span aria-hidden="true">⌕</span>
  return <span aria-hidden="true">▶</span>
}

export default function TopicLearningPathPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { sectionId, courseId } = (location.state ?? {}) as LocationState
  const [path, setPath] = useState<TopicLearningPath | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPath = useCallback(async () => {
    if (!topicId) return
    setIsLoading(true)
    setError(null)
    try { setPath(await learningPathService.getLessonsByTopic(topicId)) }
    catch (requestError) { setError(getLearningPathErrorMessage(requestError)) }
    finally { setIsLoading(false) }
  }, [topicId])

  useEffect(() => { void loadPath() }, [loadPath])

  function backToTopics() {
    if (sectionId && courseId) navigate(`/learn/courses/${courseId}/sections/${sectionId}`)
    else navigate('/learn')
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 md:px-8">
      <button type="button" onClick={backToTopics} className="mb-5 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 hover:text-emerald-600 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sky-400">← Danh sách chủ đề</button>
      <header className="mb-9 text-center"><p className="text-xs font-black uppercase tracking-widest text-emerald-600">Hành trình học tập</p><h1 className="mt-1 text-2xl font-black text-slate-800 md:text-3xl">{path?.topic.name ?? 'Đang tải chủ đề...'}</h1>{path?.topic.description && <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">{path.topic.description}</p>}</header>
      {isLoading && <div className="mx-auto flex max-w-sm flex-col items-center gap-8" aria-busy="true">{[1, 2, 3].map((item) => <div key={item} className="h-28 w-28 animate-pulse rounded-full bg-slate-200" />)}</div>}
      {error && <section className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-6 text-center" role="alert"><h2 className="text-lg font-black text-rose-700">Không thể tải bài học</h2><p className="mt-1 text-sm text-rose-600">{error}</p><button type="button" onClick={() => void loadPath()} className="mt-4 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_4px_0_#9f1239]">Thử lại</button></section>}
      {!isLoading && !error && path?.lessons.length === 0 && <section className="rounded-2xl border-2 border-slate-200 bg-white p-10 text-center shadow-[0_4px_0_#e2e8f0]"><h2 className="text-xl font-black text-slate-800">Chưa có bài học khả dụng</h2><p className="mt-2 text-sm text-slate-500">Chủ đề này đang được biên soạn.</p></section>}
      {!isLoading && !error && path && path.lessons.length > 0 && <ol className="mx-auto flex max-w-md flex-col items-center">{path.lessons.map((lesson, index) => { const locked = lesson.isLocked || lesson.progressStatus === 'LOCKED'; const offset = index % 2 === 0 ? 'mr-16 md:mr-24' : 'ml-16 md:ml-24'; return <li key={lesson.id} className="relative flex w-full flex-col items-center">{index > 0 && <div className="h-10 w-1 bg-slate-200" />}<button type="button" disabled={locked} aria-label={`${lesson.name}: ${locked ? 'Chưa mở khóa' : 'Bắt đầu học'}`} title={locked ? 'Hoàn thành bài trước để mở khóa.' : lesson.name} onClick={() => navigate(`/learn/lessons/${lesson.id}/start`, { state: { lesson } })} className={`group flex h-28 w-28 items-center justify-center rounded-full border-2 text-3xl font-black transition-transform focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-sky-400 enabled:hover:-translate-y-1 disabled:cursor-not-allowed ${offset} ${nodeClass(lesson)}`}><NodeIcon status={lesson.progressStatus} /></button><article className={`mt-3 w-64 rounded-2xl border-2 border-slate-200 bg-white p-4 text-center shadow-[0_3px_0_#e2e8f0] ${offset}`}><h2 className="font-black text-slate-800">{lesson.name}</h2><p className="mt-1 text-xs leading-relaxed text-slate-500">{lesson.description ?? `${lesson.questionCount} câu hỏi`}</p><p className="mt-2 text-xs font-black uppercase tracking-wider text-slate-400">{lesson.questionCount} câu · Đạt {lesson.requiredScore}%</p>{lesson.progressStatus === 'IN_PROGRESS' && <span className="mt-2 inline-block rounded-lg bg-sky-100 px-2 py-1 text-xs font-black text-sky-700">Đang học</span>}{lesson.progressStatus === 'COMPLETED' && <span className="mt-2 inline-block rounded-lg bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-700">Đã hoàn thành</span>}{locked && <span className="mt-2 inline-block text-xs font-bold text-slate-400">Hoàn thành bài trước để mở khóa</span>}</article></li> })}</ol>}
    </main>
  )
}
