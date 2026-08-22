import { useEffect, useState, useMemo } from 'react'
import { userService } from '../../services/user.service'
import type { SectionVocabularyGroup, SectionVocabularyItem } from '../../types/user.types'

export default function LearnedVocabularyPage() {
  const [sections, setSections] = useState<SectionVocabularyGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LEARNED' | 'UNLEARNED'>('ALL')
  const [playingWord, setPlayingWord] = useState<string | null>(null)
  const [expandedSectionIds, setExpandedSectionIds] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const data = await userService.getVocabulariesBySections()
        setSections(data)

        // Expand all sections by default
        const initialExpanded: Record<string, boolean> = {}
        for (const sec of data) {
          initialExpanded[sec.sectionId] = true
        }
        setExpandedSectionIds(initialExpanded)
      } catch (err) {
        console.error('Failed to fetch vocabularies by sections', err)
      } finally {
        setIsLoading(false)
      }
    }
    void fetchData()
  }, [])

  // Calculate totals
  const { totalCount, learnedTotal, unlearnedTotal } = useMemo(() => {
    let total = 0
    let learned = 0
    let unlearned = 0
    for (const sec of sections) {
      total += sec.totalVocabularies
      learned += sec.learnedCount
      unlearned += sec.unlearnedCount
    }
    return { totalCount: total, learnedTotal: learned, unlearnedTotal: unlearned }
  }, [sections])

  // Filter sections data based on search query and status filter
  const filteredSections = useMemo(() => {
    return sections
      .map((sec) => {
        const filteredTopics = sec.topics
          .map((top) => {
            const filteredVocabs = top.vocabularies.filter((v) => {
              const matchesSearch =
                v.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
                v.meaning.toLowerCase().includes(searchQuery.toLowerCase())

              const matchesStatus =
                statusFilter === 'ALL' ||
                (statusFilter === 'LEARNED' && v.isLearned) ||
                (statusFilter === 'UNLEARNED' && !v.isLearned)

              return matchesSearch && matchesStatus
            })

            return {
              ...top,
              vocabularies: filteredVocabs,
            }
          })
          .filter((top) => top.vocabularies.length > 0)

        return {
          ...sec,
          topics: filteredTopics,
        }
      })
      .filter((sec) => sec.topics.length > 0)
  }, [sections, searchQuery, statusFilter])

  function toggleSection(secId: string) {
    setExpandedSectionIds((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }))
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

  return (
    <main className="w-full max-w-4xl px-4 py-6 md:px-8">
      {/* Header Banner */}
      <div className="mb-8 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white shadow-lg md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-2xl">📚</span>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-100">
                Kho Từ Vựng Theo Phần Học
              </span>
            </div>
            <h1 className="text-2xl font-black md:text-3xl">Sổ Từ Vựng</h1>
            <p className="mt-1 text-sm font-bold text-emerald-50">
              Phân loại từ vựng theo từng Phần học & Chủ đề với trạng thái đã học rõ ràng
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/20 px-5 py-3 backdrop-blur-md self-start md:self-auto">
            <div className="text-center">
              <span className="block text-2xl font-black">{learnedTotal}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100">
                Đã học
              </span>
            </div>
            <div className="h-8 w-px bg-white/30" />
            <div className="text-center">
              <span className="block text-2xl font-black">{totalCount}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100">
                Tổng số từ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="mb-6 flex flex-col gap-4">
        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-4 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider transition-all ${
              statusFilter === 'ALL'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            🌟 Tất cả từ vựng ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('LEARNED')}
            className={`rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider transition-all ${
              statusFilter === 'LEARNED'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-emerald-600 hover:bg-emerald-50 dark:bg-gray-800 dark:text-emerald-400'
            }`}
          >
            🟢 Đã học ({learnedTotal})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('UNLEARNED')}
            className={`rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider transition-all ${
              statusFilter === 'UNLEARNED'
                ? 'bg-gray-600 text-white shadow-md'
                : 'bg-white text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            ⚪ Chưa học ({unlearnedTotal})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm từ tiếng Anh hoặc tiếng Việt..."
            className="w-full rounded-2xl border-2 border-gray-200 bg-white py-3 pl-11 pr-4 text-sm font-bold outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="mt-4 text-sm font-bold text-gray-500">Đang tải danh sách từ vựng...</p>
        </div>
      ) : filteredSections.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 text-6xl">📖</div>
          <h3 className="text-lg font-black text-gray-800 dark:text-white">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Không tìm thấy từ vựng phù hợp'
              : 'Chưa có từ vựng nào'}
          </h3>
          <p className="mt-2 text-sm font-bold text-gray-500">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Thử thay đổi từ khóa tìm kiếm hoặc đổi tab bộ lọc.'
              : 'Hãy bắt đầu các bài học để cập nhật từ vựng nhé!'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {filteredSections.map((sec) => {
            const isExpanded = expandedSectionIds[sec.sectionId] ?? true

            return (
              <section
                key={sec.sectionId}
                className="overflow-hidden rounded-3xl border-2 border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                {/* Section Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(sec.sectionId)}
                  className="flex w-full items-center justify-between bg-gray-50 p-5 text-left transition-colors hover:bg-gray-100 dark:bg-gray-800/80 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-lg text-white font-black">
                      {sec.orderIndex}
                    </span>
                    <div>
                      <h2 className="text-lg font-black text-gray-900 dark:text-white">
                        {sec.sectionName}
                      </h2>
                      {sec.description && (
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                          {sec.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      🟢 {sec.learnedCount}/{sec.totalVocabularies} Từ đã học
                    </span>
                    <span className="text-gray-400 transition-transform duration-200">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </div>
                </button>

                {/* Section Content Topics */}
                {isExpanded && (
                  <div className="flex flex-col gap-6 p-6">
                    {sec.topics.map((top) => (
                      <div key={top.topicId} className="flex flex-col gap-3">
                        {/* Topic Title */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-500 font-black">🎯</span>
                            <h3 className="text-base font-black text-gray-800 dark:text-gray-200">
                              {top.topicName}
                            </h3>
                          </div>
                          <span className="text-xs font-bold text-gray-400">
                            {top.learnedCount}/{top.totalVocabularies} từ
                          </span>
                        </div>

                        {/* Vocabulary Grid */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          {top.vocabularies.map((v) => (
                            <VocabularyCard key={v.id} item={v} onSpeak={handleSpeak} playingWord={playingWord} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </main>
  )
}

function VocabularyCard({
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
      className={`group relative flex flex-col justify-between rounded-2xl border-2 p-5 transition-all ${
        item.isLearned
          ? 'border-emerald-200 bg-white shadow-sm hover:border-emerald-400 hover:shadow-md dark:border-emerald-900/60 dark:bg-gray-900'
          : 'border-gray-200 bg-gray-50/70 opacity-75 dark:border-gray-800 dark:bg-gray-900/40'
      }`}
    >
      <div>
        {/* Top bar with Badge */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h4
                className={`text-xl font-black ${
                  item.isLearned
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {item.word}
              </h4>
              {item.partOfSpeech && (
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-black uppercase text-gray-500 dark:bg-gray-800">
                  {item.partOfSpeech}
                </span>
              )}
            </div>
            {item.phonetic && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {item.phonetic}
              </span>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {item.isLearned ? (
              <span className="rounded-xl bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                🟢 ĐÃ HỌC
              </span>
            ) : (
              <span className="rounded-xl bg-gray-200 px-2.5 py-1 text-[11px] font-black text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                ⚪ CHƯA HỌC
              </span>
            )}

            {/* Audio Speak button */}
            <button
              type="button"
              onClick={() => onSpeak(item.word, item.audioUrl)}
              title="Phát âm từ"
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                playingWord === item.word
                  ? 'bg-emerald-500 text-white scale-95'
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400'
              }`}
            >
              🔊
            </button>
          </div>
        </div>

        {/* Meaning */}
        <p
          className={`mt-3 text-base font-bold ${
            item.isLearned
              ? 'text-gray-800 dark:text-gray-200'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {item.meaning}
        </p>

        {/* Example */}
        {item.example && (
          <div className="mt-3 rounded-xl bg-gray-50 p-3 text-xs dark:bg-gray-800/60">
            <p className="font-semibold text-gray-700 dark:text-gray-300">
              &quot;{item.example}&quot;
            </p>
            {item.exampleMeaning && (
              <p className="mt-1 font-medium text-gray-500 dark:text-gray-400">
                {item.exampleMeaning}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-[11px] font-bold text-gray-400 dark:border-gray-800">
        {item.isLearned ? (
          <span className="flex items-center gap-1 text-amber-500">
            ⭐ Cấp {item.masteryLevel} (Đã ôn {item.reviewCount} lần)
          </span>
        ) : (
          <span className="italic text-gray-400">Hoàn thành bài học để mở khóa</span>
        )}
        <span className="rounded-lg bg-gray-100 px-2 py-0.5 uppercase tracking-wider text-gray-500 dark:bg-gray-800">
          {item.difficulty === 'EASY'
            ? 'Dễ'
            : item.difficulty === 'MEDIUM'
            ? 'Vừa'
            : 'Khó'}
        </span>
      </div>
    </div>
  )
}
