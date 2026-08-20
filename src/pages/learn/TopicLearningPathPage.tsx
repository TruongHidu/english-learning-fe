import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import LessonPath from '../../components/learning/LessonPath'
import { learningPathService } from '../../services/learning-path.service'
import type {
  LearningPathLesson,
  TopicLearningPath,
} from '../../types/learning-path.types'
import { getLearningPathErrorMessage } from '../../utils/learning-errors'

interface LocationState {
  sectionId?: string
  courseId?: string
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
    try {
      setPath(await learningPathService.getLessonsByTopic(topicId))
    } catch (requestError) {
      setError(getLearningPathErrorMessage(requestError))
    } finally {
      setIsLoading(false)
    }
  }, [topicId])

  useEffect(() => {
    void loadPath()
  }, [loadPath])

  const backToTopics = () => {
    if (sectionId && courseId) {
      navigate(`/learn/courses/${courseId}/sections/${sectionId}`)
      return
    }
    navigate('/learn')
  }

  const openLesson = (lesson: LearningPathLesson) => {
    if (lesson.isLocked) return
    navigate(`/learn/lessons/${lesson.id}/start`, {
      state: { lesson, sectionId, courseId },
    })
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 md:px-8">
      <button
        type="button"
        onClick={backToTopics}
        className="learning-back-action mb-5 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
      >
        ← Danh sách chủ đề
      </button>

      <header className="mb-9 text-center">
        <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
          Hành trình học tập
        </p>
        <h1 className="learning-heading-color mt-1 text-2xl font-black md:text-3xl">
          {path?.topic.name ?? 'Đang tải chủ đề...'}
        </h1>
        {path?.topic.description ? (
          <p className="learning-muted-color mx-auto mt-2 max-w-xl text-sm">
            {path.topic.description}
          </p>
        ) : null}
      </header>

      {isLoading ? (
        <div className="mx-auto flex max-w-sm flex-col items-center gap-8" aria-busy="true">
          {[1, 2, 3].map((item) => (
            <div key={item} className="learning-skeleton h-28 w-28 animate-pulse rounded-full" />
          ))}
        </div>
      ) : null}

      {!isLoading && error ? (
        <section className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-6 text-center" role="alert">
          <h2 className="text-lg font-black text-rose-700">Không thể tải bài học</h2>
          <p className="mt-1 text-sm text-rose-600">{error}</p>
          <button
            type="button"
            onClick={() => void loadPath()}
            className="mt-4 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_4px_0_#9f1239]"
          >
            Thử lại
          </button>
        </section>
      ) : null}

      {!isLoading && !error && path ? (
        <LessonPath lessons={path.lessons} onSelectLesson={openLesson} />
      ) : null}
    </main>
  )
}
