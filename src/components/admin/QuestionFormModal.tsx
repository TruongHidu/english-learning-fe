import { useEffect, useRef, useState } from 'react'
import type {
  CreateQuestionInput,
  QuestionFormSubmission,
  QuestionMediaFieldErrors,
  QuestionResponse,
  QuestionType,
} from '../../types/question.types'
import type { VocabularyDifficulty, VocabularyResponse } from '../../types/vocabulary.types'
import {
  AUDIO_ACCEPT,
  formatFileSize,
  IMAGE_ACCEPT,
  validateQuestionAudio,
  validateQuestionImage,
} from '../../utils/question-media'

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/

interface QuestionFormModalProps {
  isOpen: boolean
  question?: QuestionResponse | null
  vocabularyId?: string
  topicVocabularies?: VocabularyResponse[]
  isLoading: boolean
  serverError?: string | null
  serverMediaErrors?: QuestionMediaFieldErrors
  uploadProgress?: number | null
  onSubmit: (values: QuestionFormSubmission) => Promise<void>
  onClose: () => void
}

export default function QuestionFormModal({
  isOpen,
  question,
  vocabularyId,
  topicVocabularies = [],
  isLoading,
  serverError,
  serverMediaErrors,
  uploadProgress,
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
  const [selectedVocabIds, setSelectedVocabIds] = useState<string[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [existingAudioUrl, setExistingAudioUrl] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [removeAudio, setRemoveAudio] = useState(false)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [audioError, setAudioError] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  const [options, setOptions] = useState<
    Array<{ content: string; imageUrl?: string; isCorrect: boolean }>
  >([
    { content: '', isCorrect: true },
    { content: '', isCorrect: false },
    { content: '', isCorrect: false },
    { content: '', isCorrect: false },
  ])

  const [matchingPairs, setMatchingPairs] = useState<
    Array<{ leftValue: string; rightValue: string }>
  >([
    { leftValue: '', rightValue: '' },
    { leftValue: '', rightValue: '' },
    { leftValue: '', rightValue: '' },
  ])

  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setImageFile(null)
      setAudioFile(null)
      return
    }
    setLocalError(null)
    setImageFile(null)
    setAudioFile(null)
    setRemoveImage(false)
    setRemoveAudio(false)
    setImageError(null)
    setAudioError(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
    if (audioInputRef.current) audioInputRef.current.value = ''
    if (question) {
      setType(question.type)
      setContent(question.content)
      setInstruction(question.instruction ?? '')
      setExplanation(question.explanation ?? '')
      setDifficulty(question.difficulty ?? 'EASY')
      setExistingAudioUrl(question.audioUrl)
      setExistingImageUrl(question.imageUrl)

      const initialVIds = Array.from(
        new Set(
          [
            ...(question.vocabularies?.map((item) => item.id) ?? []),
            ...(question.vocabularyIds ?? []),
            ...(question.vocabularyId ? [question.vocabularyId] : []),
          ].filter((id) => OBJECT_ID_PATTERN.test(id)),
        ),
      )
      setSelectedVocabIds(initialVIds)

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
      setExistingAudioUrl(null)
      setExistingImageUrl(null)
      setSelectedVocabIds(vocabularyId ? [vocabularyId] : [])
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
  }, [isOpen, question, vocabularyId])

  useEffect(() => {
    setImageError(serverMediaErrors?.image ?? null)
    setAudioError(serverMediaErrors?.audio ?? null)
  }, [serverMediaErrors])

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(imageFile)
    setImagePreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [imageFile])

  useEffect(() => {
    if (!audioFile) {
      setAudioPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(audioFile)
    setAudioPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [audioFile])

  if (!isOpen) return null

  const toggleVocabulary = (vId: string) => {
    setSelectedVocabIds((prev) =>
      prev.includes(vId) ? prev.filter((id) => id !== vId) : [...prev, vId],
    )
  }

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

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    if (!file) return

    const validationError = validateQuestionImage(file)
    if (validationError) {
      setImageFile(null)
      setImageError(validationError)
      event.currentTarget.value = ''
      return
    }

    setImageFile(file)
    setRemoveImage(false)
    setImageError(null)
  }

  const handleAudioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    if (!file) return

    const validationError = validateQuestionAudio(file)
    if (validationError) {
      setAudioFile(null)
      setAudioError(validationError)
      event.currentTarget.value = ''
      return
    }

    setAudioFile(file)
    setRemoveAudio(false)
    setAudioError(null)
  }

  const clearSelectedImage = () => {
    setImageFile(null)
    setImageError(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const clearSelectedAudio = () => {
    setAudioFile(null)
    setAudioError(null)
    if (audioInputRef.current) audioInputRef.current.value = ''
  }

  const removeExistingAudio = () => {
    if (type === 'LISTENING' && !audioFile) {
      setAudioError('Không thể xóa âm thanh khi câu hỏi vẫn là bài nghe')
      return
    }
    setRemoveAudio(true)
    setAudioError(null)
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

    const willHaveAudio =
      Boolean(audioFile) || (!removeAudio && Boolean(existingAudioUrl))
    if (type === 'LISTENING' && !willHaveAudio) {
      setAudioError('File âm thanh là bắt buộc cho câu hỏi nghe')
      return
    }

    const payload: CreateQuestionInput = {
      type,
      content: content.trim(),
      instruction: instruction.trim() || undefined,
      explanation: explanation.trim() || undefined,
      difficulty,
    }

    // Khi edit từ Ngân hàng câu hỏi, form không có danh sách từ vựng để chỉnh.
    // Không gửi lại các ID do API chi tiết trả về để backend giữ nguyên liên kết cũ.
    if (!isEdit || topicVocabularies.length > 0) {
      payload.vocabularyId =
        selectedVocabIds.length > 0 ? selectedVocabIds[0] : undefined
      payload.vocabularyIds = selectedVocabIds
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
      if (!correctAnswerText.trim()) {
        setLocalError('Đáp án chính xác là bắt buộc cho loại câu hỏi này')
        return
      }
      payload.correctAnswer = correctAnswerText.trim()

      const validExtraOptions = options.filter((o) => o.content.trim().length > 0)
      if (validExtraOptions.length > 0) {
        payload.options = validExtraOptions.map((o, idx) => ({
          content: o.content.trim(),
          isCorrect: o.content.trim().toLowerCase() === correctAnswerText.trim().toLowerCase(),
          orderIndex: idx + 1,
        }))
      } else if (type === 'ORDER_SENTENCE') {
        const words = correctAnswerText.trim().split(/\s+/).filter(Boolean)
        payload.options = words.map((word, idx) => ({
          content: word,
          isCorrect: true,
          orderIndex: idx + 1,
        }))
      }
    }

    await onSubmit({
      payload,
      imageFile,
      audioFile,
      removeImage,
      removeAudio,
    })
  }

  const displayedImageUrl =
    imagePreviewUrl ?? (!removeImage ? existingImageUrl : null)
  const displayedAudioUrl =
    audioPreviewUrl ?? (!removeAudio ? existingAudioUrl : null)

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

          {/* Chọn Từ Vựng Liên Kết (Hỗ trợ 1 hoặc nhiều từ) */}
          {topicVocabularies.length > 0 ? (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-emerald-900">
                  🔤 Từ vựng liên kết ({selectedVocabIds.length} từ đã chọn)
                </label>
                <span className="text-[11px] font-semibold text-emerald-700">
                  (Bấm vào thẻ để chọn/bỏ chọn từ vựng)
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {topicVocabularies.map((v) => {
                  const isSelected = selectedVocabIds.includes(v.id)
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => toggleVocabulary(v.id)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs scale-102'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-400'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {v.word} ({v.meaning})
                    </button>
                  )
                })}
              </div>
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
                onChange={(e) => {
                  const nextType = e.target.value as QuestionType
                  setType(nextType)
                  if (nextType !== 'LISTENING') setAudioError(null)
                }}
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
                    ? 'VD: Sắp xếp các từ thành câu hoàn chỉnh:'
                    : type === 'TRANSLATION'
                      ? 'VD: She likes reading books'
                      : 'VD: Chọn đáp án có nghĩa đúng'
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
              Hướng dẫn làm bài (Instruction)
            </label>
            <input
              className="admin-field"
              placeholder="VD: Chọn 1 đáp án chính xác"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <label
                  className="block text-xs font-extrabold text-slate-700 mb-1.5"
                  htmlFor="question-image-file"
                >
                  Ảnh minh họa
                </label>
                <input
                  ref={imageInputRef}
                  id="question-image-file"
                  type="file"
                  accept={IMAGE_ACCEPT}
                  className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:font-bold file:text-emerald-800 hover:file:bg-emerald-200"
                  onChange={handleImageChange}
                  disabled={isLoading}
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  JPEG, PNG, WebP hoặc GIF · tối đa 5 MB
                </p>
              </div>

              {displayedImageUrl ? (
                <div className="space-y-2">
                  <img
                    src={displayedImageUrl}
                    alt={imageFile ? 'Xem trước ảnh mới' : 'Ảnh câu hỏi hiện tại'}
                    className="h-36 w-full rounded-lg border border-slate-200 bg-white object-contain"
                  />
                  {imageFile ? (
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="min-w-0 truncate font-semibold text-slate-600">
                        {imageFile.name} · {formatFileSize(imageFile.size)}
                      </span>
                      <button
                        type="button"
                        className="shrink-0 font-bold text-rose-600"
                        onClick={clearSelectedImage}
                        disabled={isLoading}
                      >
                        Bỏ file
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="text-xs font-bold text-rose-600"
                      onClick={() => {
                        setRemoveImage(true)
                        setImageError(null)
                      }}
                      disabled={isLoading}
                    >
                      Xóa ảnh hiện tại
                    </button>
                  )}
                </div>
              ) : null}

              {removeImage && existingImageUrl && !imageFile ? (
                <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <span>Ảnh hiện tại sẽ bị xóa.</span>
                  <button
                    type="button"
                    className="font-bold"
                    onClick={() => setRemoveImage(false)}
                    disabled={isLoading}
                  >
                    Hoàn tác
                  </button>
                </div>
              ) : null}

              {imageError ? (
                <p className="text-xs font-semibold text-rose-600" role="alert">
                  {imageError}
                </p>
              ) : null}
            </section>

            <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <label
                  className="block text-xs font-extrabold text-slate-700 mb-1.5"
                  htmlFor="question-audio-file"
                >
                  File âm thanh {type === 'LISTENING' ? '*' : ''}
                </label>
                <input
                  ref={audioInputRef}
                  id="question-audio-file"
                  type="file"
                  accept={AUDIO_ACCEPT}
                  className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-100 file:px-3 file:py-2 file:font-bold file:text-sky-800 hover:file:bg-sky-200"
                  onChange={handleAudioChange}
                  disabled={isLoading}
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  MP3, WAV, OGG, MP4 hoặc WebM · tối đa 20 MB
                </p>
              </div>

              {displayedAudioUrl ? (
                <div className="space-y-2">
                  <audio controls src={displayedAudioUrl} className="w-full" />
                  {audioFile ? (
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="min-w-0 truncate font-semibold text-slate-600">
                        {audioFile.name} · {formatFileSize(audioFile.size)}
                      </span>
                      <button
                        type="button"
                        className="shrink-0 font-bold text-rose-600"
                        onClick={clearSelectedAudio}
                        disabled={isLoading}
                      >
                        Bỏ file
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="text-xs font-bold text-rose-600"
                      onClick={removeExistingAudio}
                      disabled={isLoading}
                    >
                      Xóa âm thanh hiện tại
                    </button>
                  )}
                </div>
              ) : null}

              {removeAudio && existingAudioUrl && !audioFile ? (
                <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <span>Âm thanh hiện tại sẽ bị xóa.</span>
                  <button
                    type="button"
                    className="font-bold"
                    onClick={() => {
                      setRemoveAudio(false)
                      setAudioError(null)
                    }}
                    disabled={isLoading}
                  >
                    Hoàn tác
                  </button>
                </div>
              ) : null}

              {audioError ? (
                <p className="text-xs font-semibold text-rose-600" role="alert">
                  {audioError}
                </p>
              ) : null}
            </section>
          </div>

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

          {type !== 'MULTIPLE_CHOICE' && type !== 'MATCHING' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Đáp án chính xác (Correct Answer) *
                </label>
                <input
                  className="admin-field"
                  placeholder="Nhập đáp án đúng..."
                  value={correctAnswerText}
                  onChange={(e) => setCorrectAnswerText(e.target.value)}
                />
              </div>

              {type === 'ORDER_SENTENCE' && correctAnswerText.trim() ? (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                  <label className="block text-xs font-extrabold text-emerald-900">
                    🧩 Xem trước các thẻ từ được tách tự động ({correctAnswerText.trim().split(/\s+/).length} thẻ từ):
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {correctAnswerText.trim().split(/\s+/).map((w, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-emerald-600 text-white font-black text-xs rounded-xl shadow-xs"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
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

          {isLoading && uploadProgress !== null && uploadProgress !== undefined ? (
            <div className="space-y-1.5" role="status" aria-live="polite">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Đang tải dữ liệu lên...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-[width]"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : null}

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
