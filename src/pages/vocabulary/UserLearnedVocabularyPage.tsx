import { useState } from 'react'
import { useLearnedVocabularies } from '../../hooks/useLearnedVocabulary'
import { useReviewSession, useSubmitReviewResults, useReviewStats } from '../../hooks/useVocabularyReview'

export default function UserLearnedVocabularyPage() {
  const { items, isLoading, refetch } = useLearnedVocabularies()
  const { stats, refetch: refetchStats } = useReviewStats()
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [isForceAll, setIsForceAll] = useState(false)

  const handleSpeak = (text: string, audioUrl?: string | null) => {
    if (audioUrl) {
      new Audio(audioUrl).play().catch(() => speakBrowser(text))
    } else {
      speakBrowser(text)
    }
  }

  const speakBrowser = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <>
      <main className="section-main">
        <header className="section-heading flex justify-between items-end">
          <div>
            <span>TỪ VỰNG CỦA BẠN</span>
            <h1>Từ Vựng Đã Học</h1>
          </div>
        </header>

        {/* Lesson List */}
        <div className="mt-8">
          {isLoading ? (
            <div className="section-content-placeholder">
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="section-content-placeholder">
              <div>
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <rect x="8" y="10" width="48" height="44" rx="8" />
                  <path d="M19 24h26M19 33h20M19 42h15" />
                </svg>
                <p>Chưa có từ vựng nào. Hãy hoàn thành các bài học nhé!</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {items.map((lesson) => (
                <div key={lesson.lessonId} className="learning-surface learning-surface--soft border-2 rounded-[19px] p-6 shadow-sm flex flex-col mb-6">
                  <h3 className="text-[13px] font-black uppercase tracking-[1.1px] text-sky-400 mb-1">
                    BÀI HỌC
                  </h3>
                  <h2 className="text-2xl font-black text-white mb-6">
                    {lesson.lessonName}
                  </h2>

                  <div className="flex flex-col gap-4">
                    {lesson.vocabularies.map((v) => (
                      <div key={v.id} className={`flex justify-between items-center rounded-2xl p-4 transition-all border-2 ${v.excludedFromReview ? 'bg-[#1a1c23]/60 border-gray-800' : 'bg-[#262a34] border-[#373b45] hover:bg-[#2b2f3a]'}`}>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-3">
                            <span className={`text-xl font-black ${v.excludedFromReview ? 'text-gray-500' : 'text-white'}`}>
                              {v.vocabulary.word}
                            </span>
                            {v.vocabulary.phonetic && (
                              <span className="text-sm font-bold text-sky-500">
                                {v.vocabulary.phonetic}
                              </span>
                            )}
                            <button
                              onClick={() => handleSpeak(v.vocabulary.word, v.vocabulary.audioUrl)}
                              className="w-7 h-7 rounded-full bg-[#353945] text-sky-400 flex items-center justify-center hover:bg-[#434856] transition-colors text-xs border-b-2 border-[#1e2027]"
                            >
                              🔊
                            </button>
                          </div>
                          <span className={`text-[15px] font-bold ${v.excludedFromReview ? 'text-gray-600' : 'text-gray-400'}`}>
                            {v.vocabulary.meaning}
                          </span>
                          {v.vocabulary.example && (
                            <div className="mt-2 text-sm italic text-gray-500 border-l-2 border-gray-600 pl-3">
                              {v.vocabulary.example}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end justify-center">
                          {v.status === 'MASTERED' ? (
                            <span className="text-[11px] uppercase font-black tracking-wider text-emerald-400">Đã Master</span>
                          ) : (
                            <span className="text-[11px] uppercase font-black tracking-wider text-amber-400">Lv. {v.reviewLevel}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <aside className="right-rail" aria-label="Thông tin ôn tập">
        <article className="sample-card">
          <span className="sample-card__eyebrow">ÔN TẬP SRS</span>
          <h2>Bắt đầu ôn tập</h2>
          <p className="mb-4">Bạn có <strong>{stats.dueToday} từ vựng</strong> cần được ôn tập lại hôm nay để củng cố trí nhớ dài hạn.</p>
          
          {stats.dueToday > 0 ? (
            <button
              onClick={() => { setIsForceAll(false); setIsReviewMode(true) }}
              className="w-full py-4 bg-sky-500 text-white rounded-2xl font-black uppercase tracking-wider text-sm hover:bg-sky-400 active:scale-[0.98] transition-all shadow-[0_4px_0_#0284c7] active:shadow-none active:translate-y-1"
            >
              Bắt Đầu Ôn Tập
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="w-full py-4 bg-[#2d313a] text-emerald-400 rounded-2xl font-black text-sm uppercase tracking-wider text-center border-2 border-[#373b45]">
                Đã hoàn thành hôm nay
              </div>
              <button
                onClick={() => { setIsForceAll(true); setIsReviewMode(true) }}
                className="w-full py-4 bg-sky-500 text-white rounded-2xl font-black uppercase tracking-wider text-sm hover:bg-sky-400 active:scale-[0.98] transition-all shadow-[0_4px_0_#0284c7] active:shadow-none active:translate-y-1"
              >
                Ôn Tập Lại Tất Cả
              </button>
            </div>
          )}
        </article>
      </aside>

      {/* Review Modal */}
      {isReviewMode && (
        <ReviewModal 
          forceAll={isForceAll}
          onClose={() => {
            setIsReviewMode(false)
            setIsForceAll(false)
            refetchStats()
            refetch()
          }} 
        />
      )}
    </>
  )
}

function ReviewModal({ onClose, forceAll = false }: { onClose: () => void; forceAll?: boolean }) {
  const { items, isLoading, error } = useReviewSession({ limit: 15, forceAll })
  const { submit, isLoading: isSubmitting } = useSubmitReviewResults()
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [results, setResults] = useState<{ vocabularyId: string; isCorrect: boolean }[]>([])
  const [isFinished, setIsFinished] = useState(false)
  const [rewards, setRewards] = useState<any>(null)

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-sm">
        <div className="text-white font-bold text-xl">Đang tải...</div>
      </div>
    )
  }

  if (error || items.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-sm p-4">
        <div className="bg-white p-8 rounded-[30px] max-w-md w-full text-center shadow-2xl">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-black mb-2 text-gray-800">Bạn đã ôn tập xong!</h2>
          <p className="font-bold text-gray-500 mb-8">{error ? `Lỗi: ${error}` : 'Bạn không còn từ nào cần ôn lúc này.'}</p>
          <button
            onClick={onClose}
            className="w-full py-4 bg-sky-500 text-white rounded-2xl font-black uppercase tracking-wider shadow-[0_4px_0_#0284c7]"
          >
            Đóng
          </button>
        </div>
      </div>
    )
  }

  if (isFinished) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-sm p-4">
        <div className="bg-white p-8 rounded-[30px] max-w-md w-full text-center shadow-2xl">
          <div className="text-6xl mb-4 animate-bounce">🏆</div>
          <h2 className="text-2xl font-black mb-2 text-gray-800">Hoàn thành phiên ôn tập!</h2>
          <p className="font-bold text-gray-500 mb-6">Trí nhớ của bạn rất tuyệt vời.</p>
          
          {rewards && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6 text-amber-600 font-black text-xl">
              +{rewards.xpEarned} XP
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-wider shadow-[0_4px_0_#059669]"
          >
            Xong
          </button>
        </div>
      </div>
    )
  }

  const currentItem = items[currentIndex]

  const handleAnswer = async (isCorrect: boolean) => {
    const newResults = [...results, { vocabularyId: currentItem.vocabularyId._id || currentItem.vocabularyId.id, isCorrect }]
    setResults(newResults)
    
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowAnswer(false)
    } else {
      try {
        const res = await submit(newResults)
        setRewards(res.rewards)
        setIsFinished(true)
      } catch (err) {
        alert("Lỗi khi gửi kết quả")
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-sm p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="bg-white/20 rounded-full h-3 flex-1 mr-4 overflow-hidden">
            <div 
              className="bg-sky-500 h-full transition-all duration-300" 
              style={{ width: `${(currentIndex / items.length) * 100}%` }}
            />
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[30px] p-8 shadow-2xl min-h-[350px] flex flex-col items-center justify-center text-center relative overflow-hidden">
          <span className="absolute top-6 left-1/2 -translate-x-1/2 text-[11px] font-black uppercase tracking-widest text-gray-300">
            TỪ TIẾNG ANH
          </span>
          
          <h2 className="text-5xl font-black text-gray-900 mb-3 mt-4">{currentItem.vocabularyId.word}</h2>
          {currentItem.vocabularyId.phonetic && (
            <span className="text-lg font-bold text-sky-500 mb-6">{currentItem.vocabularyId.phonetic}</span>
          )}

          <div className={`w-full mt-4 transition-all duration-300 ${showAnswer ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="h-px w-24 bg-gray-200 mx-auto mb-6" />
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-300 block mb-2">NGHĨA TIẾNG VIỆT</span>
            <p className="text-3xl font-bold text-gray-800">{currentItem.vocabularyId.meaning}</p>
            {currentItem.vocabularyId.example && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-100">
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-1">Ví Dụ</span>
                <p className="text-gray-600 italic font-medium">{currentItem.vocabularyId.example}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8">
          {!showAnswer ? (
            <button
              onClick={() => setShowAnswer(true)}
              className="w-full py-5 bg-sky-500 text-white rounded-2xl font-black text-xl tracking-wider shadow-[0_5px_0_#0284c7] hover:bg-sky-400 active:translate-y-1 active:shadow-none transition-all uppercase"
            >
              Hiện Đáp Án
            </button>
          ) : (
            <div className="flex gap-4">
              <button
                disabled={isSubmitting}
                onClick={() => handleAnswer(false)}
                className="flex-1 py-5 bg-gray-600 text-white rounded-2xl font-black text-lg tracking-wider shadow-[0_5px_0_#4b5563] hover:bg-gray-500 active:translate-y-1 active:shadow-none transition-all uppercase"
              >
                Quên
              </button>
              <button
                disabled={isSubmitting}
                onClick={() => handleAnswer(true)}
                className="flex-1 py-5 bg-emerald-500 text-white rounded-2xl font-black text-lg tracking-wider shadow-[0_5px_0_#059669] hover:bg-emerald-400 active:translate-y-1 active:shadow-none transition-all uppercase"
              >
                Nhớ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
