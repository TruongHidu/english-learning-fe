import { useEffect, useState } from 'react'
import type {
  CreateVocabularyInput,
  VocabularyDifficulty,
  VocabularyResponse,
} from '../../types/vocabulary.types'

interface VocabularyFormModalProps {
  isOpen: boolean
  vocabulary?: VocabularyResponse | null
  isLoading: boolean
  serverError?: string | null
  onSubmit: (values: CreateVocabularyInput) => Promise<void>
  onClose: () => void
}

export default function VocabularyFormModal({
  isOpen,
  vocabulary,
  isLoading,
  serverError,
  onSubmit,
  onClose,
}: VocabularyFormModalProps) {
  const isEdit = Boolean(vocabulary)
  const [word, setWord] = useState('')
  const [meaning, setMeaning] = useState('')
  const [phonetic, setPhonetic] = useState('')
  const [partOfSpeech, setPartOfSpeech] = useState('')
  const [example, setExample] = useState('')
  const [exampleMeaning, setExampleMeaning] = useState('')
  const [difficulty, setDifficulty] = useState<VocabularyDifficulty>('EASY')
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setLocalError(null)
    if (vocabulary) {
      setWord(vocabulary.word)
      setMeaning(vocabulary.meaning)
      setPhonetic(vocabulary.phonetic ?? '')
      setPartOfSpeech(vocabulary.partOfSpeech ?? '')
      setExample(vocabulary.example ?? '')
      setExampleMeaning(vocabulary.exampleMeaning ?? '')
      setDifficulty(vocabulary.difficulty ?? 'EASY')
    } else {
      setWord('')
      setMeaning('')
      setPhonetic('')
      setPartOfSpeech('')
      setExample('')
      setExampleMeaning('')
      setDifficulty('EASY')
    }
  }, [isOpen, vocabulary])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!word.trim()) {
      setLocalError('Từ vựng không được để trống')
      return
    }
    if (!meaning.trim()) {
      setLocalError('Nghĩa không được để trống')
      return
    }

    await onSubmit({
      word: word.trim(),
      meaning: meaning.trim(),
      phonetic: phonetic.trim() || undefined,
      partOfSpeech: partOfSpeech.trim() || undefined,
      example: example.trim() || undefined,
      exampleMeaning: exampleMeaning.trim() || undefined,
      difficulty,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border-2 border-slate-200 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <h2 className="text-xl font-extrabold text-slate-800">
            {isEdit ? 'Chỉnh sửa từ vựng' : 'Thêm từ vựng mới'}
          </h2>
          <button
            type="button"
            className="text-slate-500 p-2 font-bold"
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
                Từ vựng *
              </label>
              <input
                autoFocus
                className="admin-field"
                placeholder="VD: apple"
                value={word}
                onChange={(e) => setWord(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Định nghĩa / Nghĩa *
              </label>
              <input
                className="admin-field"
                placeholder="VD: quả táo"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Phiên âm
              </label>
              <input
                className="admin-field"
                placeholder="/ˈæp.əl/"
                value={phonetic}
                onChange={(e) => setPhonetic(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Từ loại
              </label>
              <input
                className="admin-field"
                placeholder="noun, verb..."
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Độ khó
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
              Câu ví dụ (Tiếng Anh)
            </label>
            <input
              className="admin-field"
              placeholder="I eat an apple every day."
              value={example}
              onChange={(e) => setExample(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
              Nghĩa câu ví dụ (Tiếng Việt)
            </label>
            <input
              className="admin-field"
              placeholder="Tôi ăn một quả táo mỗi ngày."
              value={exampleMeaning}
              onChange={(e) => setExampleMeaning(e.target.value)}
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
              {isLoading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo từ vựng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
