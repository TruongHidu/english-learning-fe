import { useEffect, useState } from 'react'
import type { QuestionOption, QuestionResponse } from '../../types/question.types'


import { removeVietnameseAccents } from '../../utils/vietnamese'

interface QuestionPreviewModalProps {
  isOpen: boolean
  question: QuestionResponse | null
  onClose: () => void
}

const PAIR_COLORS = [
  { bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-emerald-700', lightBg: 'bg-emerald-50' },
  { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-blue-700', lightBg: 'bg-blue-50' },
  { bg: 'bg-amber-500', border: 'border-amber-600', text: 'text-amber-700', lightBg: 'bg-amber-50' },
  { bg: 'bg-purple-500', border: 'border-purple-600', text: 'text-purple-700', lightBg: 'bg-purple-50' },
  { bg: 'bg-rose-500', border: 'border-rose-600', text: 'text-rose-700', lightBg: 'bg-rose-50' },
]

export default function QuestionPreviewModal({
  isOpen,
  question,
  onClose,
}: QuestionPreviewModalProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | number | null>(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [selectedPairs, setSelectedPairs] = useState<Record<string, string>>({})
  const [activeLeft, setActiveLeft] = useState<string | null>(null)
  const [orderWords, setOrderWords] = useState<string[]>([])
  const [availableChips, setAvailableChips] = useState<string[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  // Dynamic Shuffled State
  const [shuffledOptions, setShuffledOptions] = useState<QuestionOption[]>([])

  const [shuffledRightPairs, setShuffledRightPairs] = useState<string[]>([])

  useEffect(() => {
    if (!isOpen || !question) return
    setSelectedOptionId(null)
    setTextAnswer('')
    setSelectedPairs({})
    setActiveLeft(null)
    setOrderWords([])
    setIsSubmitted(false)
    setIsCorrect(null)
    setIsPlayingAudio(false)

    // 1. Tráo đáp án ngẫu nhiên cho MULTIPLE_CHOICE
    if (question.type === 'MULTIPLE_CHOICE' && question.options) {
      setShuffledOptions([...question.options].sort(() => Math.random() - 0.5))
    } else {
      setShuffledOptions([])
    }

    // 2. Tráo ngẫu nhiên vế phải (Tiếng Việt) cho MATCHING
    if (question.type === 'MATCHING' && question.matchingPairs) {
      const rights = question.matchingPairs.map((p) => p.rightValue)
      setShuffledRightPairs([...rights].sort(() => Math.random() - 0.5))
    } else {
      setShuffledRightPairs([])
    }

    // 3. Khởi tạo chips cho ORDER_SENTENCE
    if (question.type === 'ORDER_SENTENCE') {
      const correctStr = String(question.correctAnswer ?? '')
      const correctWords = correctStr.split(/\s+/).filter(Boolean)
      const extraChips = question.options?.map((o) => o.content) ?? []
      const allChips = [...correctWords, ...extraChips]
      setAvailableChips(allChips.sort(() => Math.random() - 0.5))
    }
  }, [isOpen, question])

  if (!isOpen || !question) return null

  const handlePlayAudio = () => {
    if (!question.audioUrl) return
    setIsPlayingAudio(true)
    const audio = new Audio(question.audioUrl)
    audio.play().catch(() => setIsPlayingAudio(false))
    audio.onended = () => setIsPlayingAudio(false)
  }

  const handleLeftClick = (leftVal: string) => {
    if (isSubmitted) return
    // Nếu từ này đã được nối, gỡ nối để nối lại
    if (selectedPairs[leftVal]) {
      setSelectedPairs((prev) => {
        const next = { ...prev }
        delete next[leftVal]
        return next
      })
      setActiveLeft(null)
      return
    }
    setActiveLeft(activeLeft === leftVal ? null : leftVal)
  }

  const handleRightClick = (rightVal: string) => {
    if (isSubmitted) return
    // Nếu vế phải này đã được nối với từ khác, kiểm tra xem từ đó là gì
    const existingLeftKey = Object.keys(selectedPairs).find(
      (k) => selectedPairs[k] === rightVal,
    )

    if (existingLeftKey) {
      // Gỡ cặp nối cũ
      setSelectedPairs((prev) => {
        const next = { ...prev }
        delete next[existingLeftKey]
        return next
      })
    }

    if (activeLeft) {
      setSelectedPairs((prev) => ({
        ...prev,
        [activeLeft]: rightVal,
      }))
      setActiveLeft(null)
    }
  }

  const handleCheckAnswer = () => {
    setIsSubmitted(true)
    if (question.type === 'MULTIPLE_CHOICE') {
      const selected = question.options?.find(
        (_, idx) => idx === selectedOptionId || _.id === selectedOptionId || _.content === selectedOptionId,
      )
      setIsCorrect(Boolean(selected?.isCorrect))
    } else if (question.type === 'MATCHING') {
      const pairs = question.matchingPairs ?? []
      let correctCount = 0
      for (const pair of pairs) {
        if (selectedPairs[pair.leftValue] === pair.rightValue) {
          correctCount++
        }
      }
      setIsCorrect(correctCount === pairs.length && pairs.length > 0)
    } else if (question.type === 'ORDER_SENTENCE') {
      const userSentence = orderWords.join(' ').trim()
      const targetSentence = String(question.correctAnswer ?? '').trim()
      const isMatch = removeVietnameseAccents(userSentence) === removeVietnameseAccents(targetSentence)
      setIsCorrect(isMatch)
    } else {
      const targetStr = String(question.correctAnswer ?? '').trim()
      const userStr = textAnswer.trim()
      const isMatch = removeVietnameseAccents(userStr) === removeVietnameseAccents(targetStr)
      setIsCorrect(isMatch)
    }
  }

  const handleReset = () => {
    setSelectedOptionId(null)
    setTextAnswer('')
    setSelectedPairs({})
    setActiveLeft(null)
    setOrderWords([])
    setIsSubmitted(false)
    setIsCorrect(null)
  }

  // Lấy chỉ số cặp màu sắc cho bài MATCHING
  const pairedKeys = Object.keys(selectedPairs)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-slate-100 overflow-y-auto max-h-[92vh] flex flex-col">
        {/* Header Preview Mode */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full uppercase tracking-wider">
              👀 Xem trước học viên (Đã tráo đáp án)
            </span>
            <span className="text-xs font-bold text-slate-500">
              {question.type} · {question.difficulty}
            </span>
          </div>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-700 p-2 font-bold text-xl rounded-lg hover:bg-slate-100 transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Question Body */}
        <div className="flex-1 space-y-6">
          {/* Instruction */}
          {question.instruction ? (
            <div className="text-sm font-extrabold text-slate-500 uppercase tracking-wide">
              {question.instruction}
            </div>
          ) : null}

          {/* Audio Button */}
          {question.audioUrl ? (
            <div className="flex items-center gap-4 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
              <button
                type="button"
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black shadow-md transition-transform active:scale-95 ${
                  isPlayingAudio ? 'bg-emerald-600 animate-pulse' : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
                onClick={handlePlayAudio}
              >
                🔊
              </button>
              <span className="text-sm font-bold text-emerald-900">
                Bấm nút để nghe đoạn âm thanh
              </span>
            </div>
          ) : null}

          {/* Question Content / Image */}
          {question.imageUrl ? (
            <img
              src={question.imageUrl}
              alt="Question illustration"
              className="w-full max-h-48 object-cover rounded-2xl border border-slate-200"
            />
          ) : null}

          <div className="text-xl md:text-2xl font-black text-slate-800 leading-snug">
            {question.content}
          </div>

          {/* Dạng bài 1: MULTIPLE_CHOICE (Đã tráo ngẫu nhiên) */}
          {question.type === 'MULTIPLE_CHOICE' && shuffledOptions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {shuffledOptions.map((opt, idx) => {
                const isSelected = selectedOptionId === opt.content || selectedOptionId === opt.id
                let optionStyle = 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'

                if (isSubmitted) {
                  if (opt.isCorrect) {
                    optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-400'
                  } else if (isSelected && !opt.isCorrect) {
                    optionStyle = 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-400'
                  }
                } else if (isSelected) {
                  optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500'
                }

                return (
                  <button
                    key={opt.id ?? idx}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => setSelectedOptionId(opt.content)}
                    className={`p-4 rounded-2xl border-2 text-left font-extrabold text-base transition-all duration-150 flex items-center justify-between shadow-xs ${optionStyle}`}
                  >
                    <span>{opt.content}</span>
                    <span className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center text-xs font-black">
                      {String.fromCharCode(65 + idx)}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : null}

          {/* Dạng bài 2: MATCHING (Nhận biết trực quan theo Huy hiệu màu & Số thứ tự) */}
          {question.type === 'MATCHING' && question.matchingPairs ? (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold text-slate-400">
                💡 Bấm 1 từ bên trái rồi bấm từ tương ứng bên phải để nối. Bấm lại vào từ đã nối để hủy.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {/* Left Column (Tiếng Anh) */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase">Vế 1 (Tiếng Anh)</div>
                  {question.matchingPairs.map((pair) => {
                    const leftVal = pair.leftValue
                    const pairIndex = pairedKeys.indexOf(leftVal)
                    const isPaired = pairIndex !== -1
                    const colorScheme = isPaired ? PAIR_COLORS[pairIndex % PAIR_COLORS.length] : null
                    const isActive = activeLeft === leftVal

                    return (
                      <button
                        key={leftVal}
                        type="button"
                        disabled={isSubmitted}
                        onClick={() => handleLeftClick(leftVal)}
                        className={`w-full p-3.5 rounded-xl border-2 font-black text-sm text-left transition-all flex items-center justify-between shadow-xs ${
                          isPaired
                            ? `${colorScheme?.lightBg} ${colorScheme?.border} ${colorScheme?.text}`
                            : isActive
                              ? 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-400'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span>{leftVal}</span>
                        {isPaired ? (
                          <span className={`px-2 py-0.5 rounded-full text-white text-xs font-black shadow-xs ${colorScheme?.bg}`}>
                            Cặp #{pairIndex + 1}
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>

                {/* Right Column (Tiếng Việt - Đã tráo ngẫu nhiên) */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase">Vế 2 (Tiếng Việt)</div>
                  {shuffledRightPairs.map((rightVal) => {
                    const matchedLeft = pairedKeys.find((k) => selectedPairs[k] === rightVal)
                    const pairIndex = matchedLeft ? pairedKeys.indexOf(matchedLeft) : -1
                    const isPaired = pairIndex !== -1
                    const colorScheme = isPaired ? PAIR_COLORS[pairIndex % PAIR_COLORS.length] : null

                    return (
                      <button
                        key={rightVal}
                        type="button"
                        disabled={isSubmitted}
                        onClick={() => handleRightClick(rightVal)}
                        className={`w-full p-3.5 rounded-xl border-2 font-black text-sm text-left transition-all flex items-center justify-between shadow-xs ${
                          isPaired
                            ? `${colorScheme?.lightBg} ${colorScheme?.border} ${colorScheme?.text}`
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span>{rightVal}</span>
                        {isPaired ? (
                          <span className={`px-2 py-0.5 rounded-full text-white text-xs font-black shadow-xs ${colorScheme?.bg}`}>
                            Cặp #{pairIndex + 1}
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {/* Dạng bài 3: ORDER_SENTENCE */}
          {question.type === 'ORDER_SENTENCE' ? (
            <div className="space-y-4 pt-2">
              <div className="min-h-16 p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-wrap gap-2 items-center">
                {orderWords.length === 0 ? (
                  <span className="text-sm font-bold text-slate-400">
                    Bấm các ô chữ bên dưới để xếp thành câu...
                  </span>
                ) : (
                  orderWords.map((word, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isSubmitted}
                      onClick={() => {
                        setOrderWords((prev) => prev.filter((_, i) => i !== idx))
                        setAvailableChips((prev) => [...prev, word])
                      }}
                      className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm rounded-xl shadow-xs transition-transform active:scale-95"
                    >
                      {word}
                    </button>
                  ))
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {availableChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => {
                      setOrderWords((prev) => [...prev, chip])
                      setAvailableChips((prev) => prev.filter((_, i) => i !== idx))
                    }}
                    className="px-3.5 py-2 bg-white border-2 border-slate-200 hover:border-slate-400 text-slate-700 font-extrabold text-sm rounded-xl shadow-xs transition-transform active:scale-95"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Dạng bài 4 & 5: FILL_BLANK, TRANSLATION, LISTENING */}
          {question.type === 'FILL_BLANK' ||
          question.type === 'TRANSLATION' ||
          question.type === 'LISTENING' ? (
            <div className="space-y-4 pt-2">
              <input
                className="w-full p-4 rounded-2xl border-2 border-slate-200 text-lg font-bold focus:border-emerald-500 focus:outline-none transition-colors"
                placeholder="Nhập câu trả lời của bạn vào đây..."
                value={textAnswer}
                disabled={isSubmitted}
                onChange={(e) => setTextAnswer(e.target.value)}
              />
            </div>
          ) : null}
        </div>

        {/* Feedback Section */}
        {isSubmitted ? (
          <div
            className={`p-4 rounded-2xl border-2 mt-6 ${
              isCorrect
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2 font-black text-lg">
              <span>{isCorrect ? '🎉 Chính xác!' : '😅 Chưa chính xác'}</span>
            </div>
            {!isCorrect ? (
              <div className="text-sm font-bold mt-1">
                Đáp án đúng:{' '}
                <span className="underline">
                  {typeof question.correctAnswer === 'string'
                    ? question.correctAnswer
                    : question.options?.find((o) => o.isCorrect)?.content ?? '—'}
                </span>
              </div>
            ) : null}
            {question.explanation ? (
              <div className="text-xs font-semibold mt-2 pt-2 border-t border-slate-200/60 opacity-90">
                💡 Giải thích: {question.explanation}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
          <button
            type="button"
            className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-extrabold hover:bg-slate-50 transition-colors text-sm"
            onClick={onClose}
          >
            Đóng
          </button>

          <div className="flex gap-2">
            {isSubmitted ? (
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-sm transition-transform active:scale-95 shadow-sm"
                onClick={handleReset}
              >
                Thử lại
              </button>
            ) : (
              <button
                type="button"
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-md transition-transform active:scale-95"
                onClick={handleCheckAnswer}
              >
                Kiểm tra đáp án
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
