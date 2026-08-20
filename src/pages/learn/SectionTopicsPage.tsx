import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { normalizeApiError } from '../../api/api-error'
import LessonPath from '../../components/learning/LessonPath'
import { courseService } from '../../services/course.service'
import { learningPathService } from '../../services/learning-path.service'
import type { UserCourseSectionResponse } from '../../types/course.types'
import type {
  LearningPathLesson,
  ProgressStatus,
  SectionTopicLearningPath,
} from '../../types/learning-path.types'
import { getLearningPathErrorMessage } from '../../utils/learning-errors'

interface LocationState {
  section?: Pick<UserCourseSectionResponse, 'name' | 'description'>
  notice?: string
}

function getProgressLabel(status: ProgressStatus): string {
  switch (status) {
    case 'COMPLETED':
      return 'Đã hoàn thành'
    case 'IN_PROGRESS':
      return 'Đang học'
    case 'LOCKED':
      return 'Đang khóa'
    default:
      return 'Sẵn sàng học'
  }
}

export default function SectionTopicsPage() {
  const { courseId, sectionId } = useParams<{
    courseId: string
    sectionId: string
  }>()
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = (location.state ?? {}) as LocationState
  const [section, setSection] = useState<UserCourseSectionResponse | null>(null)
  const [topicPaths, setTopicPaths] = useState<SectionTopicLearningPath[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSectionPath = useCallback(async () => {
    if (!courseId || !sectionId) {
      setError('Thiếu thông tin khóa học hoặc phần học.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const sections = await courseService.getPublishedSections(courseId)
      const currentSection = sections.find((item) => item.id === sectionId)

      if (!currentSection) {
        setSection(null)
        setTopicPaths([])
        setError('Không tìm thấy phần học.')
        return
      }

      setSection(currentSection)
      if (currentSection.isLocked) {
        setTopicPaths([])
        setError('Bạn cần hoàn thành tất cả bài học trong phần học trước.')
        return
      }

      setTopicPaths(await learningPathService.getSectionLearningPath(sectionId))
    } catch (requestError) {
      const apiError = normalizeApiError(requestError)
      setTopicPaths([])
      setError(getLearningPathErrorMessage(apiError))

      if (apiError.code === 'SECTION_LOCKED') {
        try {
          const refreshedSections = await courseService.getPublishedSections(courseId)
          setSection(
            refreshedSections.find((item) => item.id === sectionId) ?? null,
          )
        } catch {
          // Giữ lỗi khóa gốc nếu lần refetch section cũng thất bại.
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [courseId, sectionId])

  useEffect(() => {
    void loadSectionPath()
  }, [loadSectionPath])

  const openLesson = (lesson: LearningPathLesson) => {
    if (lesson.isLocked || !courseId || !sectionId) return

    navigate(`/learn/lessons/${lesson.id}/start`, {
      state: {
        lesson,
        courseId,
        sectionId,
        section: section
          ? { name: section.name, description: section.description }
          : locationState.section,
      },
    })
  }

  const sectionName = section?.name ?? locationState.section?.name ?? 'Lộ trình Section'
  const sectionDescription =
    section?.description ?? locationState.section?.description

  return (
    <main className="section-main pb-12">
      <button
        type="button"
        onClick={() => navigate(`/learn/courses/${courseId ?? ''}`)}
        className="learning-back-action mb-5 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
      >
        ← Quay lại khóa học
      </button>

      <header className="mb-8">
        <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
          Lộ trình học tập
        </p>
        <h1 className="learning-heading-color mt-1 text-2xl font-black md:text-3xl">
          {sectionName}
        </h1>
        {sectionDescription ? (
          <p className="learning-muted-color mt-2 max-w-2xl text-sm">
            {sectionDescription}
          </p>
        ) : null}
        {section ? (
          <div className="learning-muted-color mt-3 flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-wider">
            <span>{getProgressLabel(section.progressStatus)}</span>
            <span aria-hidden="true">•</span>
            <span>
              {section.completedLessonCount}/{section.totalLessonCount} bài học
            </span>
          </div>
        ) : null}
      </header>

      {locationState.notice ? (
        <div className="mb-6 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-800" role="status">
          {locationState.notice}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-8" aria-busy="true" aria-label="Đang tải lộ trình">
          {[1, 2].map((item) => (
            <section key={item}>
              <div className="learning-skeleton mx-auto mb-6 h-7 w-72 animate-pulse rounded-full" />
              <div className="mx-auto flex max-w-lg flex-col items-center gap-8">
                {[1, 2, 3].map((node) => (
                  <div key={node} className="learning-skeleton h-24 w-24 animate-pulse rounded-full" />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {!isLoading && error ? (
        <section className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-6 text-center" role="alert">
          <h2 className="text-lg font-black text-rose-700">
            Không thể mở phần học
          </h2>
          <p className="mt-1 text-sm text-rose-600">{error}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/learn/courses/${courseId ?? ''}`)}
              className="rounded-xl bg-rose-100 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-rose-700"
            >
              Xem các Section
            </button>
            <button
              type="button"
              onClick={() => void loadSectionPath()}
              className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_4px_0_#9f1239] active:translate-y-1 active:shadow-none"
            >
              Tải lại
            </button>
          </div>
        </section>
      ) : null}

      {!isLoading && !error && topicPaths.length === 0 ? (
        <section className="learning-surface learning-surface--raised rounded-2xl border-2 p-10 text-center">
          <h2 className="learning-heading-color text-xl font-black">
            Chưa có chủ đề khả dụng
          </h2>
          <p className="learning-muted-color mt-2 text-sm">
            Nội dung đang được biên soạn. Vui lòng quay lại sau.
          </p>
        </section>
      ) : null}

      {!isLoading && !error && topicPaths.length > 0 ? (
        <div className="space-y-16">
          {topicPaths.map(({ topic, lessons }) => (
            <section key={topic.id} aria-labelledby={`topic-${topic.id}`}>
              <div className="flex items-center gap-4">
                <span className="h-0.5 flex-1 bg-[var(--surface-border)]" aria-hidden="true" />
                <div className="max-w-lg text-center">
                  <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600">
                    Chủ đề · {topic.completedLessonCount}/{topic.totalLessonCount} bài
                  </p>
                  <h2 id={`topic-${topic.id}`} className="learning-heading-color mt-1 text-xl font-black">
                    {topic.name}
                  </h2>
                  {topic.description ? (
                    <p className="learning-muted-color mt-1 text-xs leading-relaxed">
                      {topic.description}
                    </p>
                  ) : null}
                  <span className="learning-subtle-color mt-1 inline-block text-[11px] font-black uppercase tracking-wider">
                    {getProgressLabel(topic.progressStatus)}
                  </span>
                </div>
                <span className="h-0.5 flex-1 bg-[var(--surface-border)]" aria-hidden="true" />
              </div>

              <LessonPath lessons={lessons} onSelectLesson={openLesson} />
            </section>
          ))}
        </div>
      ) : null}
    </main>
  )
}
