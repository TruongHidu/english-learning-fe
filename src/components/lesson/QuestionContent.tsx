import type { LearningQuestion } from '../../types/learning.types'

interface QuestionContentProps {
  question: LearningQuestion
}

export default function QuestionContent({ question }: QuestionContentProps) {
  return (
    <article className="lesson-question-content mb-8">
      {question.instruction && (
        <h2 className="lesson-question-instruction mb-4 text-xl font-black md:text-2xl">
          {question.instruction}
        </h2>
      )}
      
      <div className="flex items-start gap-4">
        {question.audioUrl && (
          <button
            type="button"
            className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500 text-white shadow-[0_4px_0_#0284c7] hover:bg-sky-400 active:translate-y-1 active:shadow-none transition-all"
            aria-label="Nghe âm thanh"
            onClick={() => {
              const audio = new Audio(question.audioUrl!)
              audio.play().catch(console.error)
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 5v14l-5-4H3V9h5z" />
              <path d="M15.5 16.5c1.4-1 2.5-3.3 2.5-4.5s-1.1-3.5-2.5-4.5v9z" opacity=".5" />
              <path d="M17 19.2c2.8-1.5 4.8-5.1 4.8-7.2s-2-5.7-4.8-7.2v2.1c2 1 3.2 3.6 3.2 5.1s-1.2 4.1-3.2 5.1v2.1z" />
            </svg>
          </button>
        )}
        
        <div className="flex-1">
          {question.content && (
            <p className="learning-heading-color text-xl font-bold md:text-2xl leading-relaxed">
              {question.content}
            </p>
          )}
        </div>
      </div>
      
      {question.imageUrl && (
        <img 
          src={question.imageUrl} 
          alt="Minh họa câu hỏi" 
          className="lesson-question-image mt-6 max-h-64 rounded-2xl border-2 object-cover" 
        />
      )}
    </article>
  )
}
