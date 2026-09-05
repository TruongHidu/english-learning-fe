import { useEffect, useRef, useState } from 'react'
import type { LearningQuestion } from '../../types/learning.types'

interface MatchingQuestionProps {
  question: LearningQuestion
  disabled: boolean
  onComplete: (pairs: string[]) => void
}

interface CompletedPair {
  number: number
  left: string
  right: string
}

function encodePairs(pairs: CompletedPair[]): string[] {
  return pairs.map((pair) => `${pair.left}||${pair.right}`)
}

export default function MatchingQuestion({
  question,
  disabled,
  onComplete,
}: MatchingQuestionProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [selectedRight, setSelectedRight] = useState<string | null>(null)
  const [completedPairs, setCompletedPairs] = useState<CompletedPair[]>([])
  const nextPairNumberRef = useRef(1)

  const leftItems = question.matchingLeftItems ?? []
  const rightItems = question.matchingRightItems ?? []
  const totalPairs = Math.min(leftItems.length, rightItems.length)

  useEffect(() => {
    if (selectedLeft === null || selectedRight === null) return

    const updatedPairs = [
      ...completedPairs,
      {
        number: nextPairNumberRef.current++,
        left: selectedLeft,
        right: selectedRight,
      },
    ]

    setCompletedPairs(updatedPairs)
    setSelectedLeft(null)
    setSelectedRight(null)
    onComplete(encodePairs(updatedPairs))
  }, [selectedLeft, selectedRight, completedPairs, onComplete])

  useEffect(() => {
    setSelectedLeft(null)
    setSelectedRight(null)
    setCompletedPairs([])
    nextPairNumberRef.current = 1
    onComplete([])
  }, [question.id, onComplete])

  function getLeftPair(item: string): CompletedPair | undefined {
    return completedPairs.find((pair) => pair.left === item)
  }

  function getRightPair(item: string): CompletedPair | undefined {
    return completedPairs.find((pair) => pair.right === item)
  }

  function removePair(pairToRemove: CompletedPair) {
    const updatedPairs = completedPairs.filter(
      (pair) =>
        pair.left !== pairToRemove.left || pair.right !== pairToRemove.right,
    )
    setCompletedPairs(updatedPairs)
    onComplete(encodePairs(updatedPairs))
  }

  function handleLeftClick(item: string) {
    if (disabled) return

    const matchedPair = getLeftPair(item)
    if (matchedPair) {
      removePair(matchedPair)
      return
    }

    setSelectedLeft((current) => (current === item ? null : item))
  }

  function handleRightClick(item: string) {
    if (disabled) return

    const matchedPair = getRightPair(item)
    if (matchedPair) {
      removePair(matchedPair)
      return
    }

    setSelectedRight((current) => (current === item ? null : item))
  }

  function getButtonClass(isMatched: boolean, isSelected: boolean): string {
    return `lesson-answer-option lesson-answer-option--matching lesson-match-option ${
      isMatched
        ? 'lesson-answer-option--matched'
        : isSelected
          ? 'lesson-answer-option--selected'
          : 'lesson-answer-option--idle'
    }`
  }

  return (
    <div
      className="mt-6 grid grid-cols-2 gap-3 md:gap-6"
      aria-label={`Nối các cặp từ, đã nối ${completedPairs.length} trên ${totalPairs}`}
    >
      <div className="space-y-3">
        {leftItems.map((item) => {
          const matchedPair = getLeftPair(item)
          const pairNumber = matchedPair?.number ?? null
          const isSelected = selectedLeft === item

          return (
            <button
              key={`left-${item}`}
              type="button"
              disabled={disabled}
              onClick={() => handleLeftClick(item)}
              className={getButtonClass(Boolean(matchedPair), isSelected)}
              aria-label={`${item}${pairNumber ? `, cặp số ${pairNumber}` : ''}`}
              title={
                pairNumber
                  ? `Bấm để bỏ nối cặp số ${pairNumber}`
                  : isSelected
                    ? 'Bấm để bỏ chọn'
                    : `Chọn ${item}`
              }
            >
              <span
                className={`lesson-match-number${
                  pairNumber ? ' lesson-match-number--active' : ''
                }`}
                aria-hidden="true"
              >
                {pairNumber ?? '·'}
              </span>
              <span>{item}</span>
            </button>
          )
        })}
      </div>

      <div className="space-y-3">
        {rightItems.map((item) => {
          const matchedPair = getRightPair(item)
          const pairNumber = matchedPair?.number ?? null
          const isSelected = selectedRight === item

          return (
            <button
              key={`right-${item}`}
              type="button"
              disabled={disabled}
              onClick={() => handleRightClick(item)}
              className={getButtonClass(Boolean(matchedPair), isSelected)}
              aria-label={`${item}${pairNumber ? `, cặp số ${pairNumber}` : ''}`}
              title={
                pairNumber
                  ? `Bấm để bỏ nối cặp số ${pairNumber}`
                  : isSelected
                    ? 'Bấm để bỏ chọn'
                    : `Chọn ${item}`
              }
            >
              <span
                className={`lesson-match-number${
                  pairNumber ? ' lesson-match-number--active' : ''
                }`}
                aria-hidden="true"
              >
                {pairNumber ?? '·'}
              </span>
              <span>{item}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
