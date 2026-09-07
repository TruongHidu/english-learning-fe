import type { LearningQuestion, SubmitAnswerResult } from '../../types/learning.types'

interface TranslationQuestionProps {
  question: LearningQuestion
  answer: string
  disabled: boolean
  checkResult: Pick<SubmitAnswerResult, 'isCorrect'> | null
  onChange: (value: string) => void
  onSubmit?: () => void
}

export default function TranslationQuestion({
  question,
  answer,
  disabled,
  checkResult,
  onChange,
  onSubmit,
}: TranslationQuestionProps) {
  const status = checkResult
    ? checkResult.isCorrect
      ? 'correct'
      : 'incorrect'
    : 'idle'

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key !== 'Enter' ||
      (!event.ctrlKey && !event.metaKey) ||
      disabled ||
      !answer.trim()
    ) return

    event.preventDefault()
    onSubmit?.()
  }

  return (
    <section className="lesson-translation" aria-labelledby={`translation-label-${question.id}`}>
      <label
        id={`translation-label-${question.id}`}
        className="lesson-fill-blank__label"
        htmlFor={`translation-answer-${question.id}`}
      >
        Bản dịch của bạn
      </label>
      <textarea
        id={`translation-answer-${question.id}`}
        className={`lesson-fill-blank__input lesson-translation__input lesson-fill-blank__input--${status}`}
        value={answer}
        placeholder="Nhập bản dịch tiếng Việt"
        rows={3}
        autoComplete="off"
        autoCorrect="off"
        spellCheck
        disabled={disabled}
        aria-describedby={`translation-hint-${question.id}`}
        aria-invalid={status === 'incorrect'}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <p id={`translation-hint-${question.id}`} className="lesson-fill-blank__hint">
        Nhập bản dịch rồi nhấn “Kiểm tra”. Có thể dùng Ctrl/Cmd + Enter để gửi.
      </p>
    </section>
  )
}
