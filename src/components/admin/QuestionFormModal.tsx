import { useEffect, useState } from 'react'
import type {
  CreateQuestionInput,
  QuestionResponse,
  QuestionType,
} from '../../types/question.types'
import type { VocabularyDifficulty } from '../../types/vocabulary.types'

interface QuestionFormModalProps {
  isOpen: boolean
  question?: QuestionResponse | null
  vocabularyId?: string
  isLoading: boolean
  serverError?: string | null
  onSubmit: (values: CreateQuestionInput) => Promise<void>
  onClose: () => void
}

export default function QuestionFormModal({
  isOpen,
  question,
  vocabularyId,
  isLoading,
  serverError,
  onSubmit,
  onClose,
}: QuestionFormModalProps) {
  const isEdit = Boolean(question)
  const [type, setType] = useState<QuestionType>('MULTIPLE_CHOICE')
  const [content, setContent] = useState('')
  const [instruction, setInstruction] = useState('')
  const [explanation, setExplanation] = useState('')
  const [difficulty, setDifficulty] = useState<VocabularyDifficulty>('EASY')
  const [correctAnswerText, setCorrectAnswerText] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  // Dynamic Options for MULTIPLE_CHOICE & Word Bank (FILL_BLANK / ORDER_SENTENCE)
  const [options, setOptions] = useState<
    Array<{ content: string; imageUrl?: string; isCorrect: boolean }>
  >([
    { content: '', isCorrect: true },
    { content: '', isCorrect: false },
    { content: '', isCorrect: false },
    { content: '', isCorrect: false },
  ])

  // Dynamic Matching pairs for MATCHING
  const [matchingPairs, setMatchingPairs] = useState<
    Array<{ leftValue: string; rightValue: string }>
  >([
    { leftValue: '', rightValue: '' },
    { leftValue: '', rightValue: '' },
    { leftValue: '', rightValue: '' },
  ])

  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setLocalError(null)
    if (question) {
      setType(question.type)
      setContent(question.content)
      setInstruction(question.instruction ?? '')
      setExplanation(question.explanation ?? '')
      setDifficulty(question.difficulty ?? 'EASY')
      setAudioUrl(question.audioUrl ?? '')
      setImageUrl(question.imageUrl ?? '')
      setCorrectAnswerText(
        typeof question.correctAnswer === 'string'
          ? question.correctAnswer
          : JSON.stringify(question.correctAnswer ?? ''),
      )
      if (question.options && question.options.length > 0) {
        setOptions(
          question.options.map((o) => ({
            content: o.content,
            imageUrl: o.imageUrl ?? undefined,
            isCorrect: o.isCorrect,
          })),
        )
      }
      if (question.matchingPairs && question.matchingPairs.length > 0) {
        setMatchingPairs(
          question.matchingPairs.map((m) => ({
            leftValue: m.leftValue,
            rightValue: m.rightValue,
          })),
        )
      }
    } else {
      setType('MULTIPLE_CHOICE')
      setContent('')
      setInstruction('')
      setExplanation('')
      setDifficulty('EASY')
      setAudioUrl('')
      setImageUrl('')
      setCorrectAnswerText('')
      setOptions([
        { content: '', isCorrect: true },
        { content: '', isCorrect: false },
        { content: '', isCorrect: false },
        { content: '', isCorrect: false },
      ])
      setMatchingPairs([
        { leftValue: '', rightValue: '' },
        { leftValue: '', rightValue: '' },
        { leftValue: '', rightValue: '' },
      ])
    }
  }, [isOpen, question])

  if (!isOpen) return null

  const addOption = () => {
    setOptions((prev) => [...prev, { content: '', isCorrect: false }])
  }

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      setLocalError('Phải có ít nhất 2 phương án')
      return
    }
    setOptions((prev) => prev.filter((_, i) => i !== index))
  }

  const addMatchingPair = () => {
    setMatchingPairs((prev) => [...prev, { leftValue: '', rightValue: '' }])
  }

  const removeMatchingPair = (index: number) => {
    if (matchingPairs.length <= 2) {
      setLocalError('Phải có ít nhất 2 cặp từ ghép')
      return
    }
    setMatchingPairs((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!content.trim()) {
      setLocalError('Nội dung câu hỏi không được để trống')
      return
    }

    if (type === 'FILL_BLANK' && !content.includes('___')) {
      setLocalError('Đề bài điền từ phải chứa "___" đại diện cho vị trí trống (VD: She is an ___ girl.)')
      return
    }

    if (type === 'LISTENING' && !audioUrl.trim()) {
      setLocalError('Link âm thanh (audioUrl) là bắt buộc đối với bài tập Nghe')
      return
    }

    const payload: CreateQuestionInput = {
      vocabularyId,
      type,
      content: content.trim(),
      instruction: instruction.trim() || undefined,
      explanation: explanation.trim() || undefined,
      difficulty,
      audioUrl: audioUrl.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    }

    if (type === 'MULTIPLE_CHOICE') {
      const validOptions = options.filter((o) => o.content.trim().length > 0)
      if (validOptions.length < 2) {
        setLocalError('Bài trắc nghiệm phải có ít nhất 2 phương án lựa chọn')
        return
      }
      const correctCount = validOptions.filter((o) => o.isCorrect).length
      if (correctCount !== 1) {
        setLocalError('Phải chọn đúng 1 đáp án chính xác cho bài trắc nghiệm')
        return
      }
      payload.options = validOptions.map((o, idx) => ({
        content: o.content.trim(),
        imageUrl: o.imageUrl?.trim() || undefined,
        isCorrect: o.isCorrect,
        orderIndex: idx + 1,
      }))
    } else if (type === 'MATCHING') {
      const validPairs = matchingPairs.filter(
        (m) => m.leftValue.trim() && m.rightValue.trim(),
      )
      if (validPairs.length < 2) {
        setLocalError('Bài tập ghép đôi phải có ít nhất 2 cặp từ hợp lệ')
        return
      }
      payload.matchingPairs = validPairs.map((m, idx) => ({
        leftValue: m.leftValue.trim(),
        rightValue: m.rightValue.trim(),
        orderIndex: idx + 1,
      }))
    } else {
      // FILL_BLANK, ORDER_SENTENCE, TRANSLATION, LISTENING
      if (!correctAnswerText.trim()) {
        setLocalError('Đáp án chính xác là bắt buộc cho loại câu hỏi này')
        return
      }
      payload.correctAnswer = correctAnswerText.trim()

      // Gửi kèm options nhiễu nếu Admin nhập cho FILL_BLANK / ORDER_SENTENCE
      const validExtraOptions = options.filter((o) => o.content.trim().length > 0)
      if (validExtraOptions.length > 0) {
        payload.options = validExtraOptions.map((o, idx) => ({
          content: o.content.trim(),
          isCorrect: o.content.trim().toLowerCase() === correctAnswerText.trim().toLowerCase(),
          orderIndex: idx + 1,
        }))
      }
    }

    await onSubmit(payload)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl border-2 border-slate-200 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <h2 className="text-xl font-extrabold text-slate-800">
            {isEdit ? 'Chỉnh sửa câu hỏi' : 'Tạo câu hỏi mới'}
          </h2>
          <button
            type="button"
            className="text-slate-500 p-2 font-bold text-lg"
            onClick={onClose}
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {localError || serverError ? (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {localError || serverError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Loại câu hỏi *
              </label>
              <select
                className="admin-select"
                value={type}
                onChange={(e) => setType(e.target.value as QuestionType)}
                disabled={isEdit}
              >
                <option value="MULTIPLE_CHOICE">Trắc nghiệm (MULTIPLE_CHOICE)</option>
                <option value="MATCHING">Ghép từ (MATCHING)</option>
                <option value="FILL_BLANK">Điền từ vào chỗ trống (FILL_BLANK)</option>
                <option value="ORDER_SENTENCE">Sắp xếp từ thành câu (ORDER_SENTENCE)</option>
                <option value="TRANSLATION">Dịch câu (TRANSLATION)</option>
                <option value="LISTENING">Bài nghe (LISTENING)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Độ khó *
              </label>
              <select
                className="admin-select"
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value as VocabularyDifficulty)
                }
              >
                <option value="EASY">Dễ (EASY)</option>
                <option value="MEDIUM">Vừa (MEDIUM)</option>
                <option value="HARD">Khó (HARD)</option>
              </select>
            </div>
          </div>

          {/* Đề bài / Nội dung */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
              Nội dung câu hỏi / Đề bài *
            </label>
            <textarea
              rows={3}
              className="admin-textarea"
              placeholder={
                type === 'FILL_BLANK'
                  ? 'VD: She is an ___ girl. (Dùng 3 dấu ___ đại diện cho vị trí điền)'
                  : type === 'ORDER_SENTENCE'
                    ? 'VD: Dịch câu: Tôi đi học mỗi ngày bằng xe đạp'
                    : type === 'TRANSLATION'
                      ? 'VD: She likes reading books'
                      : 'VD: Chọn đáp án có nghĩa đúng'
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            {type === 'FILL_BLANK' ? (
              <p className="text-[11px] text-amber-700 font-semibold mt-1">
                💡 Lưu ý: Hãy đặt chuỗi <code className="bg-amber-100 px-1 rounded">___</code> trong đề bài để đánh dấu chỗ trống cần điền.
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
              Hướng dẫn làm bài (Instruction)
            </label>
            <input
              className="admin-field"
              placeholder={
                type === 'FILL_BLANK'
                  ? 'VD: Chọn hoặc gõ từ thích hợp vào chỗ trống'
                  : type === 'ORDER_SENTENCE'
                    ? 'VD: Bấm chọn các từ theo đúng thứ tự câu'
                    : type === 'MATCHING'
                      ? 'VD: Nối từ Tiếng Anh với nghĩa Tiếng Việt tương ứng'
                      : 'VD: Chọn 1 đáp án chính xác'
              }
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
            />
          </div>

          {/* Link âm thanh & hình ảnh minh họa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Link Âm thanh (Audio URL) {type === 'LISTENING' ? '*' : ''}
              </label>
              <input
                className="admin-field"
                placeholder="https://example.com/audio.mp3"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Link Hình ảnh minh họa (Image URL)
              </label>
              <input
                className="admin-field"
                placeholder="https://example.com/image.png"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          </div>

          {/* 1. Trắc nghiệm (MULTIPLE_CHOICE) */}
          {type === 'MULTIPLE_CHOICE' ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-slate-700">
                  Các phương án lựa chọn (Chọn đúng 1 ô radio làm đáp án chính xác)
                </label>
                <button
                  type="button"
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  onClick={addOption}
                >
                  + Thêm lựa chọn
                </button>
              </div>

              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correct-opt"
                    checked={opt.isCorrect}
                    onChange={() => {
                      setOptions((prev) =>
                        prev.map((o, i) => ({ ...o, isCorrect: i === idx })),
                      )
                    }}
                    className="w-4 h-4 text-emerald-600 cursor-pointer"
                  />
                  <input
                    className="admin-field flex-1"
                    placeholder={`Phương án ${idx + 1}`}
                    value={opt.content}
                    onChange={(e) => {
                      const val = e.target.value
                      setOptions((prev) =>
                        prev.map((o, i) =>
                          i === idx ? { ...o, content: val } : o,
                        ),
                      )
                    }}
                  />
                  {options.length > 2 ? (
                    <button
                      type="button"
                      className="text-rose-500 hover:text-rose-700 font-bold px-2"
                      onClick={() => removeOption(idx)}
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {/* 2. Ghép đôi (MATCHING) */}
          {type === 'MATCHING' ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-slate-700">
                  Các cặp từ ghép tương ứng (Vế 1 Tiếng Anh ↔ Vế 2 Tiếng Việt)
                </label>
                <button
                  type="button"
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  onClick={addMatchingPair}
                >
                  + Thêm cặp từ
                </button>
              </div>

              {matchingPairs.map((pair, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    className="admin-field flex-1"
                    placeholder={`Vế 1 (Tiếng Anh) #${idx + 1}`}
                    value={pair.leftValue}
                    onChange={(e) => {
                      const val = e.target.value
                      setMatchingPairs((prev) =>
                        prev.map((p, i) =>
                          i === idx ? { ...p, leftValue: val } : p,
                        ),
                      )
                    }}
                  />
                  <span className="text-slate-400 font-bold">↔</span>
                  <input
                    className="admin-field flex-1"
                    placeholder={`Vế 2 (Tiếng Việt) #${idx + 1}`}
                    value={pair.rightValue}
                    onChange={(e) => {
                      const val = e.target.value
                      setMatchingPairs((prev) =>
                        prev.map((p, i) =>
                          i === idx ? { ...p, rightValue: val } : p,
                        ),
                      )
                    }}
                  />
                  {matchingPairs.length > 2 ? (
                    <button
                      type="button"
                      className="text-rose-500 hover:text-rose-700 font-bold px-2"
                      onClick={() => removeMatchingPair(idx)}
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {/* 3. Các loại còn lại: FILL_BLANK, ORDER_SENTENCE, TRANSLATION, LISTENING */}
          {type !== 'MULTIPLE_CHOICE' && type !== 'MATCHING' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Đáp án chính xác (Correct Answer) *
                </label>
                <input
                  className="admin-field"
                  placeholder={
                    type === 'FILL_BLANK'
                      ? 'VD: intelligent'
                      : type === 'ORDER_SENTENCE'
                        ? 'VD: I go to school by bicycle every day'
                        : 'VD: She likes reading books'
                  }
                  value={correctAnswerText}
                  onChange={(e) => setCorrectAnswerText(e.target.value)}
                />
              </div>

              {/* Ngân hàng từ lựa chọn (Word Bank) cho FILL_BLANK hoặc ORDER_SENTENCE */}
              {type === 'FILL_BLANK' || type === 'ORDER_SENTENCE' ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700">
                        Các từ gợi ý / từ nhiễu bổ sung (Word Bank Chips)
                      </label>
                      <p className="text-[11px] text-slate-500">
                        {type === 'FILL_BLANK'
                          ? 'Thêm các từ gợi ý nhiễu để học viên bấm chọn vào ô ___.'
                          : 'Thêm các từ nhiễu ngoài các từ trong câu chính xác để xáo trộn.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                      onClick={addOption}
                    >
                      + Thêm từ gợi ý
                    </button>
                  </div>

                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input
                        className="admin-field flex-1"
                        placeholder={`Từ gợi ý #${idx + 1}`}
                        value={opt.content}
                        onChange={(e) => {
                          const val = e.target.value
                          setOptions((prev) =>
                            prev.map((o, i) =>
                              i === idx ? { ...o, content: val } : o,
                            ),
                          )
                        }}
                      />
                      <button
                        type="button"
                        className="text-rose-500 hover:text-rose-700 font-bold px-2"
                        onClick={() => removeOption(idx)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
              Giải thích đáp án (Explanation)
            </label>
            <textarea
              rows={2}
              className="admin-textarea"
              placeholder="Giải thích cấu trúc ngữ pháp hoặc từ vựng..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              className="admin-button admin-button--secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="admin-button admin-button--primary"
              disabled={isLoading}
            >
              {isLoading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo câu hỏi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
