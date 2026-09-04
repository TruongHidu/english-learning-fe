import type {
  AiGenerationStatus,
  GeneratedMatchingPair,
  GeneratedQuestionOption,
  GeneratedQuestionCandidate,
} from '../../types/admin-ai.types'

interface AiQuestionPreviewProps {
  candidates: GeneratedQuestionCandidate[]
  vocabularies: Array<{ id: string; word: string }>
  selectedKeys: string[]
  generationStatus: AiGenerationStatus | null
  isCommitting: boolean
  onCandidatesChange: (candidates: GeneratedQuestionCandidate[]) => void
  onSelectedKeysChange: (keys: string[]) => void
  onCommit: () => Promise<void>
}

function normalize(value: string): string {
  return value.normalize('NFKC').trim().toLocaleLowerCase('en-US').replace(/\s+/gu, ' ')
}

function tokenCounts(values: string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const value of values) {
    const key = normalize(value)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

function sameTokens(answer: string, options: GeneratedQuestionOption[]): boolean {
  const answerCounts = tokenCounts(answer.trim().split(/\s+/u).filter(Boolean))
  const optionCounts = tokenCounts(options.map((option) => option.content))
  return (
    answerCounts.size === optionCounts.size &&
    Array.from(answerCounts.entries()).every(
      ([token, total]) => optionCounts.get(token) === total,
    )
  )
}

function validateCandidate(
  candidate: GeneratedQuestionCandidate,
  duplicateContent: boolean,
  availableVocabularyIds: Set<string>,
): string[] {
  const errors: string[] = []
  if (!candidate.content.trim()) errors.push('Nội dung câu hỏi là bắt buộc.')
  else if (candidate.content.trim().length > 1000) errors.push('Nội dung tối đa 1000 ký tự.')
  if ((candidate.instruction?.trim().length ?? 0) > 300) errors.push('Hướng dẫn tối đa 300 ký tự.')
  if ((candidate.explanation?.trim().length ?? 0) > 2000) errors.push('Giải thích tối đa 2000 ký tự.')
  if (duplicateContent) errors.push('Câu hỏi đang trùng loại và nội dung với đề xuất được chọn.')
  const referencedVocabularyIds = new Set<string>([
    ...(candidate.vocabularyId ? [candidate.vocabularyId] : []),
    ...(candidate.vocabularyIds ?? []),
    ...('matchingPairs' in candidate
      ? candidate.matchingPairs.flatMap((pair) => pair.vocabularyId ? [pair.vocabularyId] : [])
      : []),
  ])
  if (referencedVocabularyIds.size === 0) {
    errors.push('Phải liên kết ít nhất một Vocabulary thuộc Topic.')
  } else if (Array.from(referencedVocabularyIds).some((id) => !availableVocabularyIds.has(id))) {
    errors.push('Có Vocabulary không còn thuộc phạm vi Topic hiện tại.')
  }

  if (candidate.type === 'MULTIPLE_CHOICE') {
    if (candidate.options.length < 2 || candidate.options.length > 6) {
      errors.push('Trắc nghiệm phải có từ 2 đến 6 lựa chọn.')
    }
    const contents = candidate.options.map((option) => normalize(option.content))
    if (contents.some((content) => !content)) errors.push('Nội dung lựa chọn không được trống.')
    if (new Set(contents).size !== contents.length) errors.push('Các lựa chọn không được trùng.')
    const correct = candidate.options.filter((option) => option.isCorrect)
    if (correct.length !== 1) errors.push('Phải có đúng một lựa chọn đúng.')
    if (!candidate.correctAnswer.trim() || !correct[0] || normalize(correct[0].content) !== normalize(candidate.correctAnswer)) {
      errors.push('Đáp án đúng phải khớp với lựa chọn được đánh dấu.')
    }
  } else if (candidate.type === 'FILL_BLANK') {
    if (!/(?:_{3,}|\[\s*blank\s*\]|\.\.\.)/iu.test(candidate.content)) {
      errors.push('Câu điền từ phải có vị trí trống như _____.')
    }
    if (!candidate.correctAnswer.trim()) errors.push('Đáp án đúng là bắt buộc.')
  } else if (candidate.type === 'MATCHING') {
    if (candidate.matchingPairs.length < 2) errors.push('Ghép cặp phải có ít nhất hai cặp.')
    const left = candidate.matchingPairs.map((pair) => normalize(pair.leftValue))
    const right = candidate.matchingPairs.map((pair) => normalize(pair.rightValue))
    if (left.some((value) => !value) || right.some((value) => !value)) {
      errors.push('Hai vế của mỗi cặp không được trống.')
    }
    if (new Set(left).size !== left.length || new Set(right).size !== right.length) {
      errors.push('Các vế ghép không được trùng nhau.')
    }
  } else {
    if (!candidate.correctAnswer.trim()) errors.push('Câu hoàn chỉnh là bắt buộc.')
    if (candidate.options.length < 2 || !sameTokens(candidate.correctAnswer, candidate.options)) {
      errors.push('Các word chip phải khớp với các từ trong câu hoàn chỉnh.')
    }
  }
  return errors
}

export default function AiQuestionPreview({
  candidates,
  vocabularies,
  selectedKeys,
  generationStatus,
  isCommitting,
  onCandidatesChange,
  onSelectedKeysChange,
  onCommit,
}: AiQuestionPreviewProps) {
  if (candidates.length === 0) return null

  const selectedSet = new Set(selectedKeys)
  const availableVocabularyIds = new Set(vocabularies.map((vocabulary) => vocabulary.id))
  const contentCounts = new Map<string, number>()
  for (const candidate of candidates) {
    if (!selectedSet.has(candidate.candidateKey)) continue
    const key = `${candidate.type}\u0000${normalize(candidate.content)}`
    contentCounts.set(key, (contentCounts.get(key) ?? 0) + 1)
  }
  const errorsByKey = new Map(
    candidates.map((candidate) => {
      const key = `${candidate.type}\u0000${normalize(candidate.content)}`
      return [
        candidate.candidateKey,
        validateCandidate(
          candidate,
          selectedSet.has(candidate.candidateKey) && (contentCounts.get(key) ?? 0) > 1,
          availableVocabularyIds,
        ),
      ] as const
    }),
  )
  const selectedHaveErrors = candidates.some(
    (candidate) => selectedSet.has(candidate.candidateKey)
      && (errorsByKey.get(candidate.candidateKey)?.length ?? 0) > 0,
  )
  const committed = generationStatus === 'COMMITTED'
  const disabled = isCommitting || committed
  const canCommit = selectedKeys.length > 0 && !selectedHaveErrors && !disabled

  function updateCandidate(updated: GeneratedQuestionCandidate) {
    onCandidatesChange(
      candidates.map((candidate) =>
        candidate.candidateKey === updated.candidateKey ? updated : candidate,
      ),
    )
  }

  function toggle(candidateKey: string) {
    onSelectedKeysChange(
      selectedSet.has(candidateKey)
        ? selectedKeys.filter((key) => key !== candidateKey)
        : [...selectedKeys, candidateKey],
    )
  }

  return (
    <section className="space-y-4 rounded-3xl border-2 border-amber-300 bg-amber-50/40 p-5 dark:border-amber-900/60 dark:bg-amber-950/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-black text-gray-900 dark:text-white">Đề xuất AI chưa lưu</h3>
            <span className="rounded-full bg-amber-200 px-2.5 py-1 text-[10px] font-black uppercase text-amber-900">
              Chưa phải Question trong DB
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
            Chọn, kiểm tra đáp án và chỉnh sửa trước khi commit thành Question DRAFT.
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelectedKeysChange(
            selectedKeys.length === candidates.length
              ? []
              : candidates.map((candidate) => candidate.candidateKey),
          )}
          className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-black text-amber-900 disabled:opacity-50 dark:bg-gray-900 dark:text-amber-300"
        >
          {selectedKeys.length === candidates.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}{' '}
          ({selectedKeys.length}/{candidates.length})
        </button>
      </div>

      {committed && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs font-bold text-sky-800">
          Generation này đã được commit. Hãy tạo generation mới nếu muốn thêm câu hỏi.
        </div>
      )}

      <div className="space-y-4">
        {candidates.map((candidate, index) => {
          const selected = selectedSet.has(candidate.candidateKey)
          const errors = errorsByKey.get(candidate.candidateKey) ?? []
          return (
            <article
              key={candidate.candidateKey}
              className={`space-y-3 rounded-2xl border-2 bg-white p-4 dark:bg-gray-900 ${
                selected ? 'border-cyan-500' : 'border-gray-200 opacity-75 dark:border-gray-800'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs font-black text-gray-800 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={disabled}
                    onChange={() => toggle(candidate.candidateKey)}
                    className="h-4 w-4 accent-cyan-600"
                  />
                  Đề xuất #{index + 1} · {candidate.type}
                </label>
                <code className="rounded bg-gray-100 px-2 py-1 text-[10px] text-gray-500 dark:bg-gray-800">
                  {candidate.candidateKey}
                </code>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <CandidateTextField
                  label="Nội dung câu hỏi *"
                  value={candidate.content}
                  disabled={disabled}
                  multiline
                  onChange={(content) => updateCandidate({ ...candidate, content })}
                />
                <CandidateTextField
                  label="Hướng dẫn"
                  value={candidate.instruction ?? ''}
                  disabled={disabled}
                  multiline
                  onChange={(instruction) => updateCandidate({
                    ...candidate,
                    instruction: instruction || undefined,
                  })}
                />
                <CandidateTextField
                  label="Giải thích"
                  value={candidate.explanation ?? ''}
                  disabled={disabled}
                  multiline
                  onChange={(explanation) => updateCandidate({
                    ...candidate,
                    explanation: explanation || undefined,
                  })}
                />
                <label className="space-y-1">
                  <span className="block text-[11px] font-black uppercase text-gray-600">Độ khó</span>
                  <select
                    value={candidate.difficulty}
                    disabled={disabled}
                    onChange={(event) => updateCandidate({
                      ...candidate,
                      difficulty: event.target.value as GeneratedQuestionCandidate['difficulty'],
                    })}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </label>
              </div>

              <VocabularyReferencesEditor
                candidate={candidate}
                vocabularies={vocabularies}
                disabled={disabled}
                onChange={updateCandidate}
              />

              {candidate.type === 'MULTIPLE_CHOICE' && (
                <MultipleChoiceEditor candidate={candidate} disabled={disabled} onChange={updateCandidate} />
              )}
              {candidate.type === 'FILL_BLANK' && (
                <CandidateTextField
                  label="Đáp án đúng *"
                  value={candidate.correctAnswer}
                  disabled={disabled}
                  onChange={(correctAnswer) => updateCandidate({ ...candidate, correctAnswer })}
                />
              )}
              {candidate.type === 'MATCHING' && (
                <MatchingEditor
                  candidate={candidate}
                  vocabularies={vocabularies}
                  disabled={disabled}
                  onChange={updateCandidate}
                />
              )}
              {candidate.type === 'ORDER_SENTENCE' && (
                <OrderSentenceEditor candidate={candidate} disabled={disabled} onChange={updateCandidate} />
              )}

              {errors.length > 0 && (
                <ul className="list-disc space-y-1 rounded-xl bg-rose-50 px-7 py-3 text-[11px] font-bold text-rose-700">
                  {errors.map((error) => <li key={error}>{error}</li>)}
                </ul>
              )}
            </article>
          )
        })}
      </div>

      <div className="flex flex-col items-end gap-2 border-t border-amber-200 pt-4">
        {selectedKeys.length === 0 && <p className="text-xs font-bold text-rose-600">Chọn ít nhất một đề xuất để lưu.</p>}
        {selectedHaveErrors && <p className="text-xs font-bold text-rose-600">Hãy sửa lỗi trong các đề xuất đang chọn.</p>}
        <button
          type="button"
          disabled={!canCommit}
          onClick={() => void onCommit()}
          className="rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-black uppercase text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCommitting ? 'Đang lưu Question DRAFT...' : `Lưu ${selectedKeys.length} đề xuất thành DRAFT`}
        </button>
      </div>
    </section>
  )
}

function CandidateTextField({
  label,
  value,
  disabled,
  multiline = false,
  onChange,
}: {
  label: string
  value: string
  disabled: boolean
  multiline?: boolean
  onChange: (value: string) => void
}) {
  const className = 'w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-cyan-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white'
  return (
    <label className="space-y-1">
      <span className="block text-[11px] font-black uppercase text-gray-600 dark:text-gray-300">{label}</span>
      {multiline ? (
        <textarea rows={2} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={className} />
      ) : (
        <input value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={className} />
      )}
    </label>
  )
}

function MultipleChoiceEditor({ candidate, disabled, onChange }: {
  candidate: Extract<GeneratedQuestionCandidate, { type: 'MULTIPLE_CHOICE' }>
  disabled: boolean
  onChange: (candidate: GeneratedQuestionCandidate) => void
}) {
  function updateOptions(options: GeneratedQuestionOption[]) {
    const correct = options.find((option) => option.isCorrect)
    onChange({ ...candidate, options, correctAnswer: correct?.content ?? candidate.correctAnswer })
  }
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-black uppercase text-gray-600">Các lựa chọn và đáp án đúng</p>
      {candidate.options.map((option, index) => (
        <div key={`${candidate.candidateKey}-option-${index}`} className="flex items-center gap-2">
          <input
            type="radio"
            name={`${candidate.candidateKey}-correct`}
            checked={option.isCorrect}
            disabled={disabled}
            onChange={() => updateOptions(candidate.options.map((item, itemIndex) => ({
              ...item,
              isCorrect: itemIndex === index,
            })))}
          />
          <input
            value={option.content}
            disabled={disabled}
            onChange={(event) => updateOptions(candidate.options.map((item, itemIndex) =>
              itemIndex === index ? { ...item, content: event.target.value } : item,
            ))}
            className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => updateOptions(candidate.options.filter((_item, itemIndex) => itemIndex !== index))}
            className="rounded-lg px-2 py-1 text-xs font-black text-rose-600 disabled:opacity-50"
            aria-label={`Xóa lựa chọn ${index + 1}`}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={disabled || candidate.options.length >= 6}
        onClick={() => updateOptions([
          ...candidate.options,
          { content: '', isCorrect: false, orderIndex: candidate.options.length },
        ])}
        className="text-[11px] font-black text-cyan-700 disabled:opacity-50"
      >
        + Thêm lựa chọn
      </button>
    </div>
  )
}

function MatchingEditor({ candidate, vocabularies, disabled, onChange }: {
  candidate: Extract<GeneratedQuestionCandidate, { type: 'MATCHING' }>
  vocabularies: Array<{ id: string; word: string }>
  disabled: boolean
  onChange: (candidate: GeneratedQuestionCandidate) => void
}) {
  function updatePair(index: number, patch: Partial<GeneratedMatchingPair>) {
    onChange({
      ...candidate,
      matchingPairs: candidate.matchingPairs.map((pair, pairIndex) =>
        pairIndex === index ? { ...pair, ...patch } : pair,
      ),
    })
  }
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-black uppercase text-gray-600">Các cặp ghép</p>
      {candidate.matchingPairs.map((pair, index) => (
        <div key={`${candidate.candidateKey}-pair-${index}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_12rem_auto]">
          <input value={pair.leftValue} disabled={disabled} onChange={(event) => updatePair(index, { leftValue: event.target.value })} className="rounded-xl border border-gray-300 px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          <input value={pair.rightValue} disabled={disabled} onChange={(event) => updatePair(index, { rightValue: event.target.value })} className="rounded-xl border border-gray-300 px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          <select
            value={pair.vocabularyId ?? ''}
            disabled={disabled}
            onChange={(event) => updatePair(index, {
              vocabularyId: event.target.value || undefined,
            })}
            className="rounded-xl border border-gray-300 px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="">Không liên kết riêng</option>
            {vocabularies.map((vocabulary) => (
              <option key={vocabulary.id} value={vocabulary.id}>{vocabulary.word}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({
              ...candidate,
              matchingPairs: candidate.matchingPairs.filter((_item, itemIndex) => itemIndex !== index),
            })}
            className="rounded-lg px-2 py-1 text-xs font-black text-rose-600 disabled:opacity-50"
            aria-label={`Xóa cặp ${index + 1}`}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={disabled || candidate.matchingPairs.length >= 20}
        onClick={() => onChange({
          ...candidate,
          matchingPairs: [
            ...candidate.matchingPairs,
            {
              leftValue: '',
              rightValue: '',
              orderIndex: candidate.matchingPairs.length,
            },
          ],
        })}
        className="text-[11px] font-black text-cyan-700 disabled:opacity-50"
      >
        + Thêm cặp ghép
      </button>
    </div>
  )
}

function VocabularyReferencesEditor({ candidate, vocabularies, disabled, onChange }: {
  candidate: GeneratedQuestionCandidate
  vocabularies: Array<{ id: string; word: string }>
  disabled: boolean
  onChange: (candidate: GeneratedQuestionCandidate) => void
}) {
  const selectedIds = new Set([
    ...(candidate.vocabularyId ? [candidate.vocabularyId] : []),
    ...(candidate.vocabularyIds ?? []),
    ...('matchingPairs' in candidate
      ? candidate.matchingPairs.flatMap((pair) => pair.vocabularyId ? [pair.vocabularyId] : [])
      : []),
  ])

  function toggle(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    const vocabularyIds = Array.from(next)
    onChange({
      ...candidate,
      vocabularyId: vocabularyIds[0],
      vocabularyIds: vocabularyIds.length > 0 ? vocabularyIds : undefined,
    })
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-black uppercase text-gray-600 dark:text-gray-300">
        Vocabulary liên kết * ({selectedIds.size})
      </p>
      <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-gray-200 p-2 dark:border-gray-700">
        {vocabularies.map((vocabulary) => (
          <button
            key={vocabulary.id}
            type="button"
            disabled={disabled}
            onClick={() => toggle(vocabulary.id)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold disabled:opacity-50 ${
              selectedIds.has(vocabulary.id)
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {vocabulary.word}
          </button>
        ))}
      </div>
    </div>
  )
}

function OrderSentenceEditor({ candidate, disabled, onChange }: {
  candidate: Extract<GeneratedQuestionCandidate, { type: 'ORDER_SENTENCE' }>
  disabled: boolean
  onChange: (candidate: GeneratedQuestionCandidate) => void
}) {
  return (
    <div className="space-y-3">
      <CandidateTextField
        label="Câu hoàn chỉnh *"
        value={candidate.correctAnswer}
        disabled={disabled}
        onChange={(correctAnswer) => onChange({ ...candidate, correctAnswer })}
      />
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-black uppercase text-gray-600">Word chips</p>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({
              ...candidate,
              options: candidate.correctAnswer.trim().split(/\s+/u).filter(Boolean).map((content, index) => ({
                content,
                isCorrect: true,
                orderIndex: index,
              })),
            })}
            className="text-[11px] font-bold text-cyan-700 disabled:opacity-50"
          >
            Tạo lại chip từ đáp án
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {candidate.options.map((option, index) => (
            <input
              key={`${candidate.candidateKey}-token-${index}`}
              value={option.content}
              disabled={disabled}
              onChange={(event) => onChange({
                ...candidate,
                options: candidate.options.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, content: event.target.value } : item,
                ),
              })}
              className="w-28 rounded-xl border border-gray-300 px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
