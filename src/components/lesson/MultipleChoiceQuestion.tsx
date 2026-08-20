import AnswerOption, { type AnswerState } from './AnswerOption'
import type { LearningQuestion } from '../../types/learning.types'

interface MultipleChoiceQuestionProps {
  question: LearningQuestion
  selectedAnswer: string | null
  isSubmitting: boolean
  checkResult: { isCorrect: boolean; correctAnswer?: unknown } | null
  onSelect: (optionId: string) => void
}

export default function MultipleChoiceQuestion({
  question,
  selectedAnswer,
  isSubmitting,
  checkResult,
  onSelect,
}: MultipleChoiceQuestionProps) {
  function getAnswerState(optionId: string): AnswerState {
    if (!checkResult) {
      return selectedAnswer === optionId ? 'selected' : 'idle'
    }

    if (checkResult.isCorrect && selectedAnswer === optionId) {
      return 'correct'
    }

    if (!checkResult.isCorrect) {
      if (selectedAnswer === optionId) return 'incorrect'
    }

    return 'idle'
  }

  return (
    <div className="space-y-3 mt-6">
      {question.options?.map((option) => {
        const optId = option.id ?? option.content
        return (
          <AnswerOption
            key={optId}
            content={option.content}
            state={getAnswerState(optId)}
            disabled={isSubmitting || checkResult !== null}
            onClick={() => onSelect(optId)}
          />
        )
      })}
    </div>
  )
}
