import { useState, useEffect } from 'react'
import type { LearningQuestion } from '../../types/learning.types'

interface MatchingQuestionProps {
  question: LearningQuestion
  disabled: boolean
  onComplete: (pairs: string[]) => void
}

export default function MatchingQuestion({
  question,
  disabled,
  onComplete,
}: MatchingQuestionProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [selectedRight, setSelectedRight] = useState<string | null>(null)
  const [completedPairs, setCompletedPairs] = useState<string[]>([])
  
  const leftItems = question.matchingLeftItems ?? []
  const rightItems = question.matchingRightItems ?? []
  const totalPairs = Math.min(leftItems.length, rightItems.length)

  useEffect(() => {
    // If user selected both left and right, form a pair
    if (selectedLeft && selectedRight) {
      const newPair = `${selectedLeft}-${selectedRight}`
      
      // Update completed pairs
      const updatedPairs = [...completedPairs, newPair]
      setCompletedPairs(updatedPairs)
      
      // Reset selection
      setSelectedLeft(null)
      setSelectedRight(null)
      
      // Notify parent if all pairs are formed
      if (updatedPairs.length === totalPairs) {
        onComplete(updatedPairs)
      }
    }
  }, [selectedLeft, selectedRight, completedPairs, totalPairs, onComplete])
  
  // Also, if the component receives a new question, reset state
  useEffect(() => {
    setSelectedLeft(null)
    setSelectedRight(null)
    setCompletedPairs([])
  }, [question.id])

  const isLeftMatched = (item: string) => completedPairs.some(p => p.split('-')[0] === item)
  const isRightMatched = (item: string) => completedPairs.some(p => p.split('-')[1] === item)

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 md:gap-6">
      {/* Left Column */}
      <div className="space-y-3">
        {leftItems.map((item) => {
          const isMatched = isLeftMatched(item)
          const isSelected = selectedLeft === item
          return (
            <button
              key={`left-${item}`}
              type="button"
              disabled={disabled || isMatched}
              onClick={() => setSelectedLeft(isSelected ? null : item)}
              className={`w-full rounded-2xl border-2 px-4 py-4 text-center text-sm md:text-base font-bold transition-all relative outline-none ${
                isMatched
                  ? 'opacity-30 border-slate-200 bg-slate-50 cursor-not-allowed text-slate-400'
                  : isSelected
                  ? 'border-sky-400 bg-sky-50 text-sky-600 shadow-[0_2px_0_#38bdf8] scale-[0.98]'
                  : 'border-slate-200 bg-white text-slate-700 shadow-[0_2px_0_#e2e8f0] hover:bg-slate-50 hover:border-slate-300 cursor-pointer active:translate-y-[2px] active:shadow-none'
              }`}
            >
              {item}
            </button>
          )
        })}
      </div>

      {/* Right Column */}
      <div className="space-y-3">
        {rightItems.map((item) => {
          const isMatched = isRightMatched(item)
          const isSelected = selectedRight === item
          return (
            <button
              key={`right-${item}`}
              type="button"
              disabled={disabled || isMatched}
              onClick={() => setSelectedRight(isSelected ? null : item)}
              className={`w-full rounded-2xl border-2 px-4 py-4 text-center text-sm md:text-base font-bold transition-all relative outline-none ${
                isMatched
                  ? 'opacity-30 border-slate-200 bg-slate-50 cursor-not-allowed text-slate-400'
                  : isSelected
                  ? 'border-sky-400 bg-sky-50 text-sky-600 shadow-[0_2px_0_#38bdf8] scale-[0.98]'
                  : 'border-slate-200 bg-white text-slate-700 shadow-[0_2px_0_#e2e8f0] hover:bg-slate-50 hover:border-slate-300 cursor-pointer active:translate-y-[2px] active:shadow-none'
              }`}
            >
              {item}
            </button>
          )
        })}
      </div>
    </div>
  )
}
