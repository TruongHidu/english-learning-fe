import type {
  AiGenerationStatus,
  GeneratedVocabularyCandidate,
} from '../../types/admin-ai.types'

type EditableVocabularyField =
  | 'word'
  | 'meaning'
  | 'phonetic'
  | 'partOfSpeech'
  | 'example'
  | 'exampleMeaning'

type CandidateFieldErrors = Partial<Record<EditableVocabularyField, string>>

interface AiVocabularyPreviewProps {
  candidates: GeneratedVocabularyCandidate[]
  selectedKeys: string[]
  generationStatus: AiGenerationStatus | null
  isCommitting: boolean
  onCandidatesChange: (candidates: GeneratedVocabularyCandidate[]) => void
  onSelectedKeysChange: (keys: string[]) => void
  onCommit: () => Promise<void>
}

const FIELD_LIMITS: Record<EditableVocabularyField, number> = {
  word: 100,
  meaning: 300,
  phonetic: 100,
  partOfSpeech: 50,
  example: 500,
  exampleMeaning: 500,
}

function normalizedWord(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('en-US')
}

function validateCandidate(
  candidate: GeneratedVocabularyCandidate,
  duplicateWord: boolean,
): CandidateFieldErrors {
  const errors: CandidateFieldErrors = {}

  if (!candidate.word.trim()) errors.word = 'Từ vựng là bắt buộc.'
  else if (candidate.word.trim().length > FIELD_LIMITS.word) {
    errors.word = `Tối đa ${FIELD_LIMITS.word} ký tự.`
  } else if (duplicateWord) {
    errors.word = 'Từ này đang trùng với một đề xuất được chọn.'
  }

  if (!candidate.meaning.trim()) errors.meaning = 'Nghĩa là bắt buộc.'
  else if (candidate.meaning.trim().length > FIELD_LIMITS.meaning) {
    errors.meaning = `Tối đa ${FIELD_LIMITS.meaning} ký tự.`
  }

  const optionalFields: EditableVocabularyField[] = [
    'phonetic',
    'partOfSpeech',
    'example',
    'exampleMeaning',
  ]
  for (const field of optionalFields) {
    const value = candidate[field]
    if (value && value.trim().length > FIELD_LIMITS[field]) {
      errors[field] = `Tối đa ${FIELD_LIMITS[field]} ký tự.`
    }
  }

  return errors
}

function hasErrors(errors: CandidateFieldErrors): boolean {
  return Object.keys(errors).length > 0
}

export default function AiVocabularyPreview({
  candidates,
  selectedKeys,
  generationStatus,
  isCommitting,
  onCandidatesChange,
  onSelectedKeysChange,
  onCommit,
}: AiVocabularyPreviewProps) {
  if (candidates.length === 0) return null

  const selectedSet = new Set(selectedKeys)
  const selectedWordCounts = new Map<string, number>()
  for (const candidate of candidates) {
    if (!selectedSet.has(candidate.candidateKey)) continue
    const key = normalizedWord(candidate.word)
    selectedWordCounts.set(key, (selectedWordCounts.get(key) ?? 0) + 1)
  }

  const errorsByKey = new Map<string, CandidateFieldErrors>()
  for (const candidate of candidates) {
    const wordKey = normalizedWord(candidate.word)
    errorsByKey.set(
      candidate.candidateKey,
      validateCandidate(
        candidate,
        selectedSet.has(candidate.candidateKey) &&
          (selectedWordCounts.get(wordKey) ?? 0) > 1,
      ),
    )
  }

  const selectedHaveErrors = candidates.some(
    (candidate) =>
      selectedSet.has(candidate.candidateKey) &&
      hasErrors(errorsByKey.get(candidate.candidateKey) ?? {}),
  )
  const generationCommitted = generationStatus === 'COMMITTED'
  const canCommit =
    selectedKeys.length > 0 &&
    !selectedHaveErrors &&
    !isCommitting &&
    !generationCommitted

  function updateField(
    candidateKey: string,
    field: EditableVocabularyField,
    value: string,
  ) {
    onCandidatesChange(
      candidates.map((candidate) =>
        candidate.candidateKey === candidateKey
          ? { ...candidate, [field]: value }
          : candidate,
      ),
    )
  }

  function toggleCandidate(candidateKey: string) {
    onSelectedKeysChange(
      selectedSet.has(candidateKey)
        ? selectedKeys.filter((key) => key !== candidateKey)
        : [...selectedKeys, candidateKey],
    )
  }

  function toggleAll() {
    onSelectedKeysChange(
      selectedKeys.length === candidates.length
        ? []
        : candidates.map((candidate) => candidate.candidateKey),
    )
  }

  const fieldClass = (error?: string) =>
    `w-full rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-gray-800 outline-none dark:bg-gray-900 dark:text-white ${
      error
        ? 'border-rose-400 focus:border-rose-500'
        : 'border-gray-300 focus:border-emerald-500 dark:border-gray-700'
    }`

  return (
    <section className="space-y-4 rounded-3xl border-2 border-amber-300 bg-amber-50/40 p-5 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-black text-gray-900 dark:text-white">
              Đề xuất AI chưa lưu
            </h3>
            <span className="rounded-full bg-amber-200 px-2.5 py-1 text-[10px] font-black uppercase text-amber-900">
              Chưa phải Vocabulary trong DB
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
            Chọn và chỉnh sửa nội dung trước khi lưu thành Vocabulary DRAFT.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleAll}
          disabled={isCommitting || generationCommitted}
          className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-black text-amber-900 disabled:opacity-50 dark:bg-gray-900 dark:text-amber-300"
        >
          {selectedKeys.length === candidates.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          {' '}({selectedKeys.length}/{candidates.length})
        </button>
      </div>

      {generationCommitted && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs font-bold text-sky-800">
          Generation này đã được commit. Các đề xuất còn lại chưa được lưu; hãy tạo một danh sách mới nếu muốn tiếp tục.
        </div>
      )}

      <div className="space-y-4">
        {candidates.map((candidate, index) => {
          const isSelected = selectedSet.has(candidate.candidateKey)
          const errors = errorsByKey.get(candidate.candidateKey) ?? {}
          return (
            <article
              key={candidate.candidateKey}
              className={`rounded-2xl border-2 bg-white p-4 dark:bg-gray-900 ${
                isSelected
                  ? 'border-emerald-500'
                  : 'border-gray-200 opacity-75 dark:border-gray-800'
              }`}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-black text-gray-800 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isCommitting || generationCommitted}
                    onChange={() => toggleCandidate(candidate.candidateKey)}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  Đề xuất #{index + 1}
                </label>
                <code className="rounded bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-500 dark:bg-gray-800">
                  {candidate.candidateKey}
                </code>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <CandidateField
                  label="Từ vựng *"
                  value={candidate.word}
                  error={errors.word}
                  disabled={isCommitting || generationCommitted}
                  className={fieldClass(errors.word)}
                  onChange={(value) => updateField(candidate.candidateKey, 'word', value)}
                />
                <CandidateField
                  label="Nghĩa *"
                  value={candidate.meaning}
                  error={errors.meaning}
                  disabled={isCommitting || generationCommitted}
                  className={fieldClass(errors.meaning)}
                  onChange={(value) => updateField(candidate.candidateKey, 'meaning', value)}
                />
                <CandidateField
                  label="Phiên âm"
                  value={candidate.phonetic ?? ''}
                  error={errors.phonetic}
                  disabled={isCommitting || generationCommitted}
                  className={fieldClass(errors.phonetic)}
                  onChange={(value) => updateField(candidate.candidateKey, 'phonetic', value)}
                />
                <CandidateField
                  label="Từ loại"
                  value={candidate.partOfSpeech ?? ''}
                  error={errors.partOfSpeech}
                  disabled={isCommitting || generationCommitted}
                  className={fieldClass(errors.partOfSpeech)}
                  onChange={(value) => updateField(candidate.candidateKey, 'partOfSpeech', value)}
                />
                <CandidateField
                  label="Câu ví dụ"
                  value={candidate.example ?? ''}
                  error={errors.example}
                  disabled={isCommitting || generationCommitted}
                  className={fieldClass(errors.example)}
                  multiline
                  onChange={(value) => updateField(candidate.candidateKey, 'example', value)}
                />
                <CandidateField
                  label="Nghĩa câu ví dụ"
                  value={candidate.exampleMeaning ?? ''}
                  error={errors.exampleMeaning}
                  disabled={isCommitting || generationCommitted}
                  className={fieldClass(errors.exampleMeaning)}
                  multiline
                  onChange={(value) => updateField(candidate.candidateKey, 'exampleMeaning', value)}
                />
              </div>
            </article>
          )
        })}
      </div>

      <div className="flex flex-col items-end gap-2 border-t border-amber-200 pt-4">
        {selectedKeys.length === 0 && (
          <p className="text-xs font-bold text-rose-600">
            Chọn ít nhất một đề xuất để lưu.
          </p>
        )}
        {selectedHaveErrors && (
          <p className="text-xs font-bold text-rose-600">
            Hãy sửa các trường không hợp lệ trong những đề xuất đã chọn.
          </p>
        )}
        <button
          type="button"
          disabled={!canCommit}
          onClick={() => void onCommit()}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black uppercase text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCommitting
            ? 'Đang lưu Vocabulary DRAFT...'
            : `Lưu ${selectedKeys.length} đề xuất thành DRAFT`}
        </button>
      </div>
    </section>
  )
}

interface CandidateFieldProps {
  label: string
  value: string
  error?: string
  disabled: boolean
  className: string
  multiline?: boolean
  onChange: (value: string) => void
}

function CandidateField({
  label,
  value,
  error,
  disabled,
  className,
  multiline = false,
  onChange,
}: CandidateFieldProps) {
  return (
    <label className="space-y-1">
      <span className="block text-[11px] font-black uppercase text-gray-600 dark:text-gray-300">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          disabled={disabled}
          rows={2}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      ) : (
        <input
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      )}
      {error && <span className="block text-[11px] font-bold text-rose-600">{error}</span>}
    </label>
  )
}
