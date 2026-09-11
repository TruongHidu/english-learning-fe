import { useState } from 'react'
import { useReviewSession, useSubmitReviewResults } from '../../hooks/useVocabularyReview'

type ReviewModalProps = {
  onClose: () => void
  forceAll?: boolean
}

export default function FlashcardReviewModal({ onClose, forceAll = false }: ReviewModalProps) {
  const { items, isLoading, error } = useReviewSession({ limit: 15, forceAll })
  const { submit, isLoading: isSubmitting } = useSubmitReviewResults()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [results, setResults] = useState<{ vocabularyId: string; isCorrect: boolean }[]>([])
  const [isFinished, setIsFinished] = useState(false)
  const [rewards, setRewards] = useState<{ xpEarned?: number } | null>(null)

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="text-xl font-bold text-white">Đang tải...</div>
      </div>
    )
  }

  if (error || items.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-[30px] bg-white p-8 text-center shadow-2xl">
          <div className="mb-4 text-5xl">🎉</div>
          <h2 className="mb-2 text-2xl font-black text-gray-800">Bạn đã ôn tập xong!</h2>
          <p className="mb-8 font-bold text-gray-500">
            {error ? `Lỗi: ${error}` : 'Bạn không còn từ nào cần ôn lúc này.'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-sky-500 py-4 font-black uppercase tracking-wider text-white shadow-[0_4px_0_#0284c7]"
          >
            Đóng
          </button>
        </div>
      </div>
    )
  }

  if (isFinished) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-[30px] bg-white p-8 text-center shadow-2xl">
          <div className="mb-4 animate-bounce text-6xl">🏆</div>
          <h2 className="mb-2 text-2xl font-black text-gray-800">Hoàn thành phiên ôn tập!</h2>
          <p className="mb-6 font-bold text-gray-500">Trí nhớ của bạn rất tuyệt vời.</p>
          {rewards && (
            <div className="mb-6 rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-xl font-black text-amber-600">
              +{rewards.xpEarned ?? 0} XP
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-emerald-500 py-4 font-black uppercase tracking-wider text-white shadow-[0_4px_0_#059669]"
          >
            Xong
          </button>
        </div>
      </div>
    )
  }

  const currentItem = items[currentIndex]
  const vocabulary = currentItem.vocabularyId
  const vocabularyId = vocabulary._id || vocabulary.id

  const handleAnswer = async (isCorrect: boolean) => {
    const newResults = [...results, { vocabularyId, isCorrect }]
    setResults(newResults)

    if (currentIndex < items.length - 1) {
      setCurrentIndex((index) => index + 1)
      setShowAnswer(false)
      return
    }

    try {
      const response = await submit(newResults)
      setRewards(response.rewards ?? null)
      setIsFinished(true)
    } catch {
      window.alert('Lỗi khi gửi kết quả')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <div className="mr-4 h-3 flex-1 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full bg-sky-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
            />
          </div>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white" aria-label="Đóng flashcard">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative flex min-h-[350px] flex-col items-center justify-center overflow-hidden rounded-[30px] bg-white p-8 text-center shadow-2xl">
          <span className="absolute left-1/2 top-6 -translate-x-1/2 text-[11px] font-black uppercase tracking-widest text-gray-300">
            TỪ TIẾNG ANH
          </span>
          <h2 className="mb-3 mt-4 text-5xl font-black text-gray-900">{vocabulary.word}</h2>
          {vocabulary.phonetic && <span className="mb-6 text-lg font-bold text-sky-500">{vocabulary.phonetic}</span>}

          <div className={`mt-4 w-full transition-all duration-300 ${showAnswer ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="mx-auto mb-6 h-px w-24 bg-gray-200" />
            <span className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-300">NGHĨA TIẾNG VIỆT</span>
            <p className="text-3xl font-bold text-gray-800">{vocabulary.meaning}</p>
            {vocabulary.example && (
              <div className="mt-4 rounded-xl border-2 border-gray-100 bg-gray-50 p-4">
                <span className="mb-1 block text-[11px] font-black uppercase tracking-widest text-gray-400">Ví Dụ</span>
                <p className="font-medium italic text-gray-600">{vocabulary.example}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          {!showAnswer ? (
            <button
              type="button"
              onClick={() => setShowAnswer(true)}
              className="w-full rounded-2xl bg-sky-500 py-5 text-xl font-black uppercase tracking-wider text-white shadow-[0_5px_0_#0284c7] transition-all hover:bg-sky-400 active:translate-y-1 active:shadow-none"
            >
              Hiện Đáp Án
            </button>
          ) : (
            <div className="flex gap-4">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleAnswer(false)}
                className="flex-1 rounded-2xl bg-gray-600 py-5 text-lg font-black uppercase tracking-wider text-white shadow-[0_5px_0_#4b5563] transition-all hover:bg-gray-500 active:translate-y-1 active:shadow-none disabled:opacity-50"
              >
                Quên
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleAnswer(true)}
                className="flex-1 rounded-2xl bg-emerald-500 py-5 text-lg font-black uppercase tracking-wider text-white shadow-[0_5px_0_#059669] transition-all hover:bg-emerald-400 active:translate-y-1 active:shadow-none disabled:opacity-50"
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
