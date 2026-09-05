import type { LearningQuestion, SubmitAnswerResult } from '../../types/learning.types'

interface FillBlankQuestionProps {
  question: LearningQuestion
  answer: string
  disabled: boolean
  checkResult: Pick<SubmitAnswerResult, 'isCorrect'> | null
  onChange: (value: string) => void
  onSubmit?: () => void
}

export default function FillBlankQuestion({
  question,
  answer,
  disabled,
  checkResult,
  onChange,
  onSubmit,
}: FillBlankQuestionProps) {
  const status = checkResult
    ? checkResult.isCorrect
      ? 'correct'
      : 'incorrect'
    : 'idle'

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' || disabled || !answer.trim()) return
    event.preventDefault()
    onSubmit?.()
  }

  return (
    <section className="lesson-fill-blank" aria-labelledby={`fill-blank-label-${question.id}`}>
      <label
        id={`fill-blank-label-${question.id}`}
        className="lesson-fill-blank__label"
        htmlFor={`fill-blank-answer-${question.id}`}
      >
        Điền vào chỗ trống
      </label>
      <input
        id={`fill-blank-answer-${question.id}`}
        className={`lesson-fill-blank__input lesson-fill-blank__input--${status}`}
        type="text"
        value={answer}
        placeholder="Nhập đáp án còn thiếu"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={disabled}
        aria-describedby={`fill-blank-hint-${question.id}`}
        aria-invalid={status === 'incorrect'}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <p id={`fill-blank-hint-${question.id}`} className="lesson-fill-blank__hint">
        Nhập câu trả lời rồi nhấn “Kiểm tra”.
      </p>
    </section>
  )
}
