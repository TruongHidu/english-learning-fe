import { Link } from 'react-router-dom'
import type { LearningSession } from '../../types/learning.types'

interface LessonCompleteProps {
  session: LearningSession
  courseId?: string
  sectionId?: string
}

export default function LessonComplete({ session, courseId, sectionId }: LessonCompleteProps) {
  // Fallback URL if we don't have course context
  const continueUrl = courseId && sectionId 
    ? `/learn/courses/${courseId}/sections/${sectionId}` 
    : '/learn'

  const accuracy = session.totalQuestions > 0 
    ? Math.round((session.correctCount / session.totalQuestions) * 100)
    : 0

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-2xl flex-col items-center justify-center px-4 py-12 md:px-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="mb-8 text-8xl md:text-9xl animate-[bounce_1s_ease-in-out]">
        🎉
      </div>
      
      <h1 className="learning-heading-color mb-2 text-center text-3xl font-black md:text-4xl text-yellow-500">
        Bài học hoàn tất!
      </h1>
      
      <p className="learning-muted-color mb-10 text-center font-bold">
        Bạn đã hoàn thành xuất sắc bài học này.
      </p>

      <div className="mb-12 grid w-full grid-cols-2 gap-4 md:grid-cols-3">
        {/* Score/Accuracy */}
        <div className="lesson-result-card lesson-result-card--correct flex flex-col items-center justify-center rounded-2xl p-4 shadow-sm md:p-6">
          <span className="mb-1 text-xs font-black uppercase tracking-wider">Chính xác</span>
          <span className="text-3xl font-black">{accuracy}%</span>
        </div>
        
        {/* Score (Points) */}
        <div className="lesson-result-card lesson-result-card--score flex flex-col items-center justify-center rounded-2xl p-4 shadow-sm md:p-6">
          <span className="mb-1 text-xs font-black uppercase tracking-wider">Điểm số</span>
          <span className="text-3xl font-black">{session.score}</span>
        </div>

        {/* Hearts Remaining */}
        <div className="lesson-result-card lesson-result-card--hearts col-span-2 flex flex-col items-center justify-center rounded-2xl p-4 shadow-sm md:col-span-1 md:p-6">
          <span className="mb-1 text-xs font-black uppercase tracking-wider">Tim giữ lại</span>
          <div className="flex items-center gap-1 text-3xl font-black">
            <span>{session.heartRemaining}</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm">
        <Link
          to={continueUrl}
          className="block w-full rounded-xl bg-emerald-500 px-5 py-4 text-center text-lg font-black uppercase tracking-wider text-white shadow-[0_4px_0_#047857] transition-all hover:bg-emerald-600 active:translate-y-1 active:shadow-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
        >
          Tiếp tục
        </Link>
      </div>
    </main>
  )
}
