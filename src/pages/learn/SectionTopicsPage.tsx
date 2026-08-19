import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { learningPathService } from '../../services/learning-path.service'
import type { SectionResponse } from '../../types/course.types'
import type { UserTopic } from '../../types/learning-path.types'
import { getLearningPathErrorMessage } from '../../utils/learning-errors'

interface LocationState {
  section?: Pick<SectionResponse, 'name' | 'description'>
}

export default function SectionTopicsPage() {
  const { courseId, sectionId } = useParams<{ courseId: string; sectionId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { section } = (location.state ?? {}) as LocationState
  const [topics, setTopics] = useState<UserTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTopics = useCallback(async () => {
    if (!sectionId) return
    setIsLoading(true)
    setError(null)
    try {
      setTopics(await learningPathService.getTopicsBySection(sectionId))
    } catch (requestError) {
      setError(getLearningPathErrorMessage(requestError))
    } finally {
      setIsLoading(false)
    }
  }, [sectionId])

  useEffect(() => { void loadTopics() }, [loadTopics])

  return (
    <main className="section-main">
      <button type="button" onClick={() => navigate(`/learn/courses/${courseId ?? ''}`)} className="mb-5 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 hover:text-emerald-600 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sky-400">← Quay lại khóa học</button>
      <header className="mb-7"><p className="text-xs font-black uppercase tracking-widest text-emerald-600">Lộ trình học tập</p><h1 className="mt-1 text-2xl font-black text-slate-800 md:text-3xl">{section?.name ?? 'Chọn chủ đề'}</h1>{section?.description && <p className="mt-2 max-w-2xl text-sm text-slate-600">{section.description}</p>}</header>
      {isLoading && <div className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-busy="true">{[1, 2, 3, 4].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl border-2 border-slate-200 bg-slate-100" />)}</div>}
      {error && <section className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-6 text-center" role="alert"><h2 className="text-lg font-black text-rose-700">Không thể tải chủ đề</h2><p className="mt-1 text-sm text-rose-600">{error}</p><button type="button" onClick={() => void loadTopics()} className="mt-4 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_4px_0_#9f1239]">Thử lại</button></section>}
      {!isLoading && !error && topics.length === 0 && <section className="rounded-2xl border-2 border-slate-200 bg-white p-10 text-center shadow-[0_4px_0_#e2e8f0]"><h2 className="text-xl font-black text-slate-800">Chưa có chủ đề khả dụng</h2><p className="mt-2 text-sm text-slate-500">Nội dung đang được biên soạn. Vui lòng quay lại sau.</p></section>}
      {!isLoading && !error && topics.length > 0 && <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{topics.map((topic) => <article key={topic.id} className="flex flex-col rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-[0_4px_0_#e2e8f0]"><span className="mb-3 inline-flex w-fit rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-emerald-800">Chủ đề {topic.orderIndex}</span><h2 className="text-lg font-black text-slate-800">{topic.name}</h2><p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{topic.description ?? 'Sẵn sàng khám phá những bài học mới.'}</p><p className="mt-4 text-xs font-black uppercase tracking-wider text-slate-400">{topic.lessonCount} bài học</p><button type="button" onClick={() => navigate(`/learn/topics/${topic.id}`, { state: { sectionId, courseId } })} className="mt-4 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black uppercase tracking-wider text-white shadow-[0_4px_0_#047857] hover:bg-emerald-600 active:translate-y-1 active:shadow-none">Vào chủ đề</button></article>)}</div>}
    </main>
  )
}
