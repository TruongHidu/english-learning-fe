import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { normalizeApiError } from '../../api/api-error'
import LessonPath from '../../components/learning/LessonPath'
import GameOverModal from '../../components/lesson/GameOverModal'
import { courseService } from '../../services/course.service'
import { learningPathService } from '../../services/learning-path.service'
import { userService } from '../../services/user.service'
import type { UserCourseSectionResponse } from '../../types/course.types'
import type {
  LearningPathLesson,
  ProgressStatus,
  SectionTopicLearningPath,
} from '../../types/learning-path.types'
import type { SectionVocabularyItem, TopicVocabularyGroup } from '../../types/user.types'
import { getLearningPathErrorMessage } from '../../utils/learning-errors'
import { useAuth } from '../../hooks/useAuth'

interface LocationState {
  section?: Pick<UserCourseSectionResponse, 'name' | 'description'>
  notice?: string
  showOutOfHearts?: boolean
  heartBlockedLesson?: LearningPathLesson
}

interface LessonScrollItem {
  lesson: LearningPathLesson
  topicId: string
  topicName: string
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
  const { user } = useAuth()
  const locationState = (location.state ?? {}) as LocationState
  const [section, setSection] = useState<UserCourseSectionResponse | null>(null)
  const [sectionPosition, setSectionPosition] = useState<number | null>(null)
  const [topicPaths, setTopicPaths] = useState<SectionTopicLearningPath[]>([])
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Topic Vocabulary Modal state
  const [vocabModalTopic, setVocabModalTopic] = useState<{ id: string; name: string } | null>(null)
  const [vocabGroupData, setVocabGroupData] = useState<TopicVocabularyGroup | null>(null)
  const [isVocabLoading, setIsVocabLoading] = useState(false)
  const [vocabFilter, setVocabFilter] = useState<'ALL' | 'LEARNED' | 'UNLEARNED'>('ALL')
  const [playingWord, setPlayingWord] = useState<string | null>(null)

  const lessonPathRef = useRef<HTMLDivElement>(null)

  const lessonScrollItems = useMemo<LessonScrollItem[]>(
    () =>
      topicPaths.flatMap(({ topic, lessons }) =>
        lessons.map((lesson) => ({ lesson, topicId: topic.id, topicName: topic.name })),
      ),
    [topicPaths],
  )

  const activeLessonIndex = Math.max(
    0,
    lessonScrollItems.findIndex(({ lesson }) => lesson.id === activeLessonId),
  )
  const activeLessonItem = lessonScrollItems[activeLessonIndex]

  const loadSectionPath = useCallback(async () => {
    if (!courseId || !sectionId) {
      setError('Thiếu thông tin khóa học hoặc phần học.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    setSelectedLessonId(null)

    try {
      const sections = await courseService.getPublishedSections(courseId)
      const currentSectionIndex = sections.findIndex((item) => item.id === sectionId)
      const currentSection = sections[currentSectionIndex]

      if (!currentSection) {
        setSection(null)
        setSectionPosition(null)
        setTopicPaths([])
        setActiveLessonId(null)
        setError('Không tìm thấy phần học.')
        return
      }

      setSection(currentSection)
      setSectionPosition(currentSectionIndex + 1)
      if (currentSection.isLocked) {
        setTopicPaths([])
        setActiveLessonId(null)
        setError('Bạn cần hoàn thành tất cả bài học trong phần học trước.')
        return
      }

      const nextTopicPaths = await learningPathService.getSectionLearningPath(sectionId)
      const nextLessonIds = new Set(
        nextTopicPaths.flatMap(({ lessons }) => lessons.map((lesson) => lesson.id)),
      )

      setTopicPaths(nextTopicPaths)
      setActiveLessonId((currentLessonId) =>
        currentLessonId && nextLessonIds.has(currentLessonId)
          ? currentLessonId
          : nextTopicPaths[0]?.lessons[0]?.id ?? null,
      )
    } catch (requestError) {
      const apiError = normalizeApiError(requestError)
      setTopicPaths([])
      setActiveLessonId(null)
      setError(getLearningPathErrorMessage(apiError))

      if (apiError.code === 'SECTION_LOCKED') {
        try {
          const refreshedSections = await courseService.getPublishedSections(courseId)
          const refreshedSectionIndex = refreshedSections.findIndex(
            (item) => item.id === sectionId,
          )
          setSection(refreshedSections[refreshedSectionIndex] ?? null)
          setSectionPosition(
            refreshedSectionIndex >= 0 ? refreshedSectionIndex + 1 : null,
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

  useEffect(() => {
    const pathElement = lessonPathRef.current
    if (!pathElement || lessonScrollItems.length === 0) return

    let animationFrame: number | null = null

    const updateActiveLesson = () => {
      animationFrame = null
      const lessonElements = pathElement.querySelectorAll<HTMLElement>(
        '[data-lesson-id]',
      )
      if (lessonElements.length === 0) return

      const isAtPageStart = window.scrollY <= 2
      const isAtPageEnd =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2

      if (isAtPageStart || isAtPageEnd) {
        const edgeLesson = isAtPageStart
          ? lessonElements.item(0)
          : lessonElements.item(lessonElements.length - 1)
        const edgeLessonId = edgeLesson.dataset.lessonId

        if (edgeLessonId) {
          setActiveLessonId((currentLessonId) =>
            currentLessonId === edgeLessonId ? currentLessonId : edgeLessonId,
          )
        }
        return
      }

      const viewportTarget = window.innerHeight * 0.5
      let closestLessonId: string | undefined
      let closestDistance = Number.POSITIVE_INFINITY

      lessonElements.forEach((lessonElement) => {
        const bounds = lessonElement.getBoundingClientRect()
        const lessonCenter = bounds.top + bounds.height / 2
        const distance = Math.abs(lessonCenter - viewportTarget)

        if (distance < closestDistance) {
          closestDistance = distance
          closestLessonId = lessonElement.dataset.lessonId
        }
      })

      if (closestLessonId) {
        setActiveLessonId((currentLessonId) =>
          currentLessonId === closestLessonId
            ? currentLessonId
            : closestLessonId ?? currentLessonId,
        )
      }
    }

    const scheduleUpdate = () => {
      if (animationFrame !== null) return
      animationFrame = window.requestAnimationFrame(updateActiveLesson)
    }

    updateActiveLesson()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame)
      }
    }
  }, [lessonScrollItems])

  const selectLesson = (lesson: LearningPathLesson) => {
    if (lesson.isLocked) return
    setSelectedLessonId((currentLessonId) =>
      currentLessonId === lesson.id ? null : lesson.id,
    )
  }

  const startLesson = (lesson: LearningPathLesson) => {
    if (lesson.isLocked || !courseId || !sectionId) return

    setSelectedLessonId(null)

    navigate(`/learn/lessons/${lesson.id}/start`, {
      state: {
        lesson,
        courseId,
        sectionId,
        section: section
          ? { name: section.name, description: section.description }
          : locationState.section,
        returnTo: location.pathname,
        returnState: { section: locationState.section },
      },
    })
  }

  const dismissOutOfHearts = () => {
    navigate(location.pathname, {
      replace: true,
      state: { section: locationState.section },
    })
  }

  const openLessonVocabModal = async (lessonId: string, lessonName: string) => {
    setVocabModalTopic({ id: lessonId, name: lessonName })
    setIsVocabLoading(true)
    setVocabFilter('ALL')
    try {
      const data = await userService.getLessonVocabularies(lessonId)
      setVocabGroupData(data)
    } catch (err) {
      console.error('Lỗi tải từ vựng bài học:', err)
    } finally {
      setIsVocabLoading(false)
    }
  }

  const closeVocabModal = () => {
    setVocabModalTopic(null)
    setVocabGroupData(null)
  }

  function handleSpeak(word: string, audioUrl?: string | null) {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.play().catch(() => speakBrowser(word))
    } else {
      speakBrowser(word)
    }
  }

  function speakBrowser(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      setPlayingWord(text)
      utterance.onend = () => setPlayingWord(null)
      utterance.onerror = () => setPlayingWord(null)
      window.speechSynthesis.speak(utterance)
    }
  }

  const modalFilteredVocabs = (vocabGroupData?.vocabularies ?? []).filter((v) => {
    if (vocabFilter === 'LEARNED') return v.isLearned
    if (vocabFilter === 'UNLEARNED') return !v.isLearned
    return true
  })

  return (
    <main className="section-main pb-12">
      {!isLoading && !error && activeLessonItem ? (
        <aside className="section-lesson-banner" aria-label="Bài học hiện tại">
          <div className="section-lesson-banner__copy">
            <div className="section-lesson-banner__meta">
              <button
                type="button"
                className="section-lesson-banner__back"
                onClick={() => navigate(`/learn/courses/${courseId ?? ''}`)}
                aria-label="Quay lại khóa học"
                title="Quay lại khóa học"
              >
                ←
              </button>
              <p>Phần {sectionPosition ?? 1}, Cửa {activeLessonIndex + 1}</p>
            </div>
            <h2>{activeLessonItem.lesson.name}</h2>
            <span>{activeLessonItem.topicName}</span>
          </div>

          <button
            type="button"
            disabled={activeLessonItem.lesson.isLocked}
            onClick={() => selectLesson(activeLessonItem.lesson)}
          >
            <span aria-hidden="true">
              {activeLessonItem.lesson.isLocked ? '🔒' : '▶'}
            </span>
            {activeLessonItem.lesson.isLocked
              ? 'Đã khóa'
              : activeLessonItem.lesson.isCompleted
                ? 'Học lại'
                : activeLessonItem.lesson.progressStatus === 'IN_PROGRESS'
                  ? 'Tiếp tục'
                  : 'Bắt đầu'}
          </button>
        </aside>
      ) : null}

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
        <div ref={lessonPathRef} className="space-y-16">
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

              <LessonPath
                lessons={lessons}
                onSelectLesson={selectLesson}
                selectedLessonId={selectedLessonId}
                onStartLesson={startLesson}
                onDismissLesson={() => setSelectedLessonId(null)}
                onViewVocab={(lesson) => openLessonVocabModal(lesson.id, lesson.name)}
              />
            </section>
          ))}
        </div>
      ) : null}

      {/* Vocabulary Modal Popup */}
      {vocabModalTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900 border-2 border-emerald-500/30">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-emerald-500 p-5 text-white dark:border-gray-800">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📖</span>
                <div>
                  <h3 className="text-lg font-black">{vocabModalTopic.name}</h3>
                  <p className="text-xs font-bold text-emerald-100">
                    Từ vựng thuộc phần học này
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeVocabModal}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg font-black text-white hover:bg-white/30"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {isVocabLoading ? (
                <div className="py-12 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                  <p className="mt-3 text-xs font-bold text-gray-500">Đang tải danh sách từ vựng...</p>
                </div>
              ) : !vocabGroupData || vocabGroupData.vocabularies.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="text-4xl">📚</span>
                  <p className="mt-2 text-sm font-bold text-gray-500">Chưa có từ vựng cho phần học này.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {/* Status Filter Chips */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVocabFilter('ALL')}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-black uppercase tracking-wider transition-all ${
                        vocabFilter === 'ALL'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      Tất cả ({vocabGroupData.totalVocabularies})
                    </button>
                    <button
                      type="button"
                      onClick={() => setVocabFilter('LEARNED')}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-black uppercase tracking-wider transition-all ${
                        vocabFilter === 'LEARNED'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-gray-800 dark:text-emerald-400'
                      }`}
                    >
                      🟢 Đã học ({vocabGroupData.learnedCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setVocabFilter('UNLEARNED')}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-black uppercase tracking-wider transition-all ${
                        vocabFilter === 'UNLEARNED'
                          ? 'bg-gray-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      ⚪ Chưa học ({vocabGroupData.unlearnedCount})
                    </button>
                  </div>

                  {/* Vocabulary Grid or Empty States */}
                  {modalFilteredVocabs.length === 0 ? (
                    <div className="py-12 text-center">
                      {vocabFilter === 'LEARNED' ? (
                        <>
                          <div className="mb-2 text-4xl">🌱</div>
                          <p className="text-base font-black text-gray-800 dark:text-white">
                            Bạn chưa học từ nào
                          </p>
                          <p className="mt-1 text-xs font-bold text-gray-500">
                            Hãy hoàn thành bài học để mở khóa từ vựng nhé!
                          </p>
                        </>
                      ) : vocabFilter === 'UNLEARNED' ? (
                        <>
                          <div className="mb-2 text-4xl">🎉</div>
                          <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                            Bạn đã học hết từ phần này
                          </p>
                          <p className="mt-1 text-xs font-bold text-gray-500">
                            Tuyệt vời! Bạn đã thành thạo tất cả từ vựng trong phần học này.
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="mb-2 text-4xl">📚</div>
                          <p className="text-base font-black text-gray-700 dark:text-gray-300">
                            Chưa có từ vựng cho phần học này
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {modalFilteredVocabs.map((v) => (
                        <ModalVocabCard key={v.id} item={v} onSpeak={handleSpeak} playingWord={playingWord} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 bg-gray-50 p-4 text-center dark:border-gray-800 dark:bg-gray-800/50">
              <button
                type="button"
                onClick={closeVocabModal}
                className="rounded-xl bg-emerald-500 px-6 py-2 text-xs font-black uppercase tracking-wider text-white shadow-[0_3px_0_#047857] active:translate-y-0.5 active:shadow-none"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <GameOverModal
        isOpen={Boolean(locationState.showOutOfHearts && locationState.heartBlockedLesson)}
        courseId={courseId}
        sectionId={sectionId}
        nextHeartAt={user?.stats.nextHeartAt}
        onRetry={() => locationState.heartBlockedLesson && startLesson(locationState.heartBlockedLesson)}
        onDismiss={dismissOutOfHearts}
      />
    </main>
  )
}

function ModalVocabCard({
  item,
  onSpeak,
  playingWord,
}: {
  item: SectionVocabularyItem
  onSpeak: (word: string, audioUrl?: string | null) => void
  playingWord: string | null
}) {
  return (
    <div
      className={`flex flex-col justify-between rounded-2xl border-2 p-3.5 transition-all ${
        item.isLearned
          ? 'border-emerald-200 bg-white shadow-sm dark:border-emerald-900 dark:bg-gray-900'
          : 'border-gray-200 bg-gray-50/70 opacity-75 dark:border-gray-800 dark:bg-gray-900/40'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-1.5">
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className={`text-base font-black ${item.isLearned ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                {item.word}
              </h4>
              {item.partOfSpeech && (
                <span className="rounded bg-gray-100 px-1 py-0.5 text-[9px] font-black uppercase text-gray-500 dark:bg-gray-800">
                  {item.partOfSpeech}
                </span>
              )}
            </div>
            {item.phonetic && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {item.phonetic}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {item.isLearned ? (
              <span className="rounded-lg bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                🟢 ĐÃ HỌC
              </span>
            ) : (
              <span className="rounded-lg bg-gray-200 px-1.5 py-0.5 text-[10px] font-black text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                ⚪ CHƯA HỌC
              </span>
            )}

            <button
              type="button"
              onClick={() => onSpeak(item.word, item.audioUrl)}
              title="Phát âm từ"
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                playingWord === item.word
                  ? 'bg-emerald-500 text-white'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              🔊
            </button>
          </div>
        </div>

        <p className={`mt-1.5 text-xs font-bold ${item.isLearned ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
          {item.meaning}
        </p>

        {item.example && (
          <div className="mt-2 rounded-lg bg-gray-50 p-2 text-[10px] dark:bg-gray-800/60">
            <p className="font-semibold text-gray-700 dark:text-gray-300">
              &quot;{item.example}&quot;
            </p>
            {item.exampleMeaning && (
              <p className="mt-0.5 font-medium text-gray-500 dark:text-gray-400">
                {item.exampleMeaning}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-gray-100 pt-1.5 text-[9px] font-bold text-gray-400 dark:border-gray-800">
        {item.isLearned ? (
          <span className="text-amber-500">⭐ Cấp {item.masteryLevel} (Đã ôn {item.reviewCount} lần)</span>
        ) : (
          <span className="italic text-gray-400">Hoàn thành bài để mở</span>
        )}
        <span className="uppercase">{item.difficulty === 'EASY' ? 'Dễ' : item.difficulty === 'MEDIUM' ? 'Vừa' : 'Khó'}</span>
      </div>
    </div>
  )
}
