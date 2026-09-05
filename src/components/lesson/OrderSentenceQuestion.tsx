import { useEffect, useState } from 'react'
import type { LearningQuestion, SubmitAnswerResult } from '../../types/learning.types'

interface OrderSentenceQuestionProps {
  question: LearningQuestion
  selectedAnswer: string[] | string | null
  disabled: boolean
  checkResult: Pick<SubmitAnswerResult, 'isCorrect'> | null
  onChange: (words: string[]) => void
}

interface WordChip {
  id: string
  word: string
}

export default function OrderSentenceQuestion({
  question,
  disabled,
  checkResult,
  onChange,
}: OrderSentenceQuestionProps) {
  const [selectedChips, setSelectedChips] = useState<WordChip[]>([])
  const [availableChips, setAvailableChips] = useState<WordChip[]>([])

  useEffect(() => {
    let initialChips: WordChip[] = []

    if (question.options && question.options.length > 0) {
      initialChips = question.options.map((o, idx) => ({
        id: `${o.content}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        word: o.content.trim(),
      }))
    } else {
      const rawContent = (question.content || '').trim()
      const cleanContent = rawContent
        .replace(/^(Sắp xếp các từ|Dịch câu|Reorder).*?:\s*/i, '')
        .replace(/^["']/g, '')
        .replace(/["']$/g, '')
      const words = cleanContent.split(/\s+/).filter(Boolean)
      initialChips = words.map((w, idx) => ({
        id: `${w}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        word: w,
      }))
    }

    const shuffled = [...initialChips].sort(() => Math.random() - 0.5)

    setSelectedChips([])
    setAvailableChips(shuffled)
    onChange([])
  }, [question])

  const status = checkResult
    ? checkResult.isCorrect
      ? 'correct'
      : 'incorrect'
    : 'idle'

  const handleSelectChip = (chip: WordChip) => {
    if (disabled) return
    const nextSelected = [...selectedChips, chip]
    const nextAvailable = availableChips.filter((c) => c.id !== chip.id)

    setSelectedChips(nextSelected)
    setAvailableChips(nextAvailable)
    onChange(nextSelected.map((c) => c.word))
  }

  const handleDeselectChip = (chip: WordChip) => {
    if (disabled) return
    const nextSelected = selectedChips.filter((c) => c.id !== chip.id)
    const nextAvailable = [...availableChips, chip]

    setSelectedChips(nextSelected)
    setAvailableChips(nextAvailable)
    onChange(nextSelected.map((c) => c.word))
  }

  return (
    <section className="space-y-6" aria-labelledby={`order-sentence-label-${question.id}`}>
      <h3
        id={`order-sentence-label-${question.id}`}
        className="text-xs font-black uppercase tracking-wider text-slate-500"
      >
        {question.instruction || 'Sắp xếp các từ thành câu hoàn chỉnh'}
      </h3>

      {/* Top Box: Khu vực chứa các từ đã chọn */}
      <div
        className={`min-h-24 p-4 rounded-2xl border-2 transition-all flex flex-wrap gap-2.5 items-center ${
          status === 'correct'
            ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-400'
            : status === 'incorrect'
              ? 'border-rose-400 bg-rose-50/60 ring-2 ring-rose-400'
              : 'border-dashed border-slate-300 bg-slate-50'
        }`}
      >
        {selectedChips.length === 0 ? (
          <span className="text-sm font-bold text-slate-400 select-none">
            Bấm các thẻ từ bên dưới để ghép câu...
          </span>
        ) : (
          selectedChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              disabled={disabled}
              onClick={() => handleDeselectChip(chip)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base rounded-2xl shadow-sm transition-transform active:scale-95 cursor-pointer disabled:opacity-90"
            >
              {chip.word}
            </button>
          ))
        )}
      </div>

      {/* Bottom Box: Kho thẻ từ chưa chọn (Shuffled Word Bank) */}
      <div className="flex flex-wrap gap-2.5 pt-2">
        {availableChips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            disabled={disabled}
            onClick={() => handleSelectChip(chip)}
            className="px-4 py-2.5 bg-white border-2 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-800 font-extrabold text-base rounded-2xl shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {chip.word}
          </button>
        ))}
      </div>
    </section>
  )
}
