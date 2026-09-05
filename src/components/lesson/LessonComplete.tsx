import { Link } from 'react-router-dom'
import type { LearningSession, LessonCompletionRewards } from '../../types/learning.types'

interface LessonCompleteProps {
  session: LearningSession
  courseId?: string
  sectionId?: string
  rewards?: LessonCompletionRewards | null
  onRetry?: () => void
}

export default function LessonComplete({ session, courseId, sectionId, rewards, onRetry }: LessonCompleteProps) {
  const continueUrl = courseId && sectionId
    ? `/learn/courses/${courseId}/sections/${sectionId}`
    : '/learn'

  const accuracy = session.totalQuestions > 0
    ? Math.round((session.correctCount / session.totalQuestions) * 100)
    : 0

  const isPassed = session.status === 'COMPLETED' || (session.status !== 'FAILED' && Boolean(rewards))
  const isPerfect = isPassed && accuracy === 100

  return (
    <main className="lesson-complete-page mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col items-center justify-center px-4 py-12 md:px-8">
      {/* Trophy / Celebration */}
      <div className="mb-6 flex flex-col items-center">
        <div className="mb-3 text-[80px] md:text-[100px] lesson-bounce-anim">
          {isPerfect ? '🏆' : isPassed ? '🎉' : '📚'}
        </div>
        <h1 className="learning-heading-color mb-1 text-center text-3xl font-black md:text-4xl">
          {isPerfect ? 'Hoàn hảo!' : isPassed ? 'Bài học hoàn tất!' : 'Hãy cố lên!'}
        </h1>
        <p className="learning-muted-color text-center text-sm font-bold">
          {isPerfect
            ? 'Bạn đã trả lời đúng tất cả câu hỏi! Tuyệt vời!'
            : isPassed
            ? 'Xuất sắc! Bạn đã vượt qua bài học này.'
            : 'Hãy thử lại để cải thiện điểm số của bạn.'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid w-full grid-cols-2 gap-3 md:grid-cols-3">
        {/* Score */}
        <div className="lesson-result-card lesson-result-card--correct flex flex-col items-center justify-center rounded-2xl p-4 shadow-sm md:p-5">
          <span className="mb-1 text-xs font-black uppercase tracking-wider opacity-80">🎯 Độ chính xác</span>
          <span className="text-3xl font-black">{accuracy}%</span>
        </div>

        {/* XP Earned */}
        {rewards && (
          <div className="lesson-result-card lesson-result-card--score flex flex-col items-center justify-center rounded-2xl p-4 shadow-sm md:p-5">
            <span className="mb-1 text-xs font-black uppercase tracking-wider opacity-80">⚡ XP kiếm được</span>
            <span className="text-3xl font-black">+{rewards.xpEarned}</span>
          </div>
        )}

        {/* Hearts Remaining */}
        <div className="lesson-result-card lesson-result-card--hearts flex flex-col items-center justify-center rounded-2xl p-4 shadow-sm md:p-5">
          <span className="mb-1 text-xs font-black uppercase tracking-wider opacity-80">❤️ Tim còn lại</span>
          <span className="text-3xl font-black">{session.heartRemaining}</span>
        </div>

        {/* Streak */}
        {rewards && (
          <div className="lesson-result-card flex flex-col items-center justify-center rounded-2xl p-4 shadow-sm md:p-5" style={{ background: 'rgba(251,146,60,0.12)', color: 'var(--learning-orange, #fb923c)' }}>
            <span className="mb-1 text-xs font-black uppercase tracking-wider opacity-80">🔥 Chuỗi ngày</span>
            <span className="text-3xl font-black">{rewards.currentStreak}</span>
          </div>
        )}

        {/* Diamond Earned */}
        {rewards && (
          <div className="lesson-result-card flex flex-col items-center justify-center rounded-2xl p-4 shadow-sm md:p-5" style={{ background: 'rgba(96,165,250,0.12)', color: 'var(--learning-blue, #60a5fa)' }}>
            <span className="mb-1 text-xs font-black uppercase tracking-wider opacity-80">💎 Kim cương</span>
            <span className="text-3xl font-black">+{rewards.diamondEarned}</span>
          </div>
        )}

        {/* Words Learned */}
        {rewards && rewards.learnedVocabularyIds.length > 0 && (
          <div className="lesson-result-card flex flex-col items-center justify-center rounded-2xl p-4 shadow-sm md:p-5" style={{ background: 'rgba(167,139,250,0.12)', color: 'var(--learning-purple, #a78bfa)' }}>
            <span className="mb-1 text-xs font-black uppercase tracking-wider opacity-80">🔤 Từ đã học</span>
            <span className="text-3xl font-black">{rewards.learnedVocabularyIds.length}</span>
          </div>
        )}
      </div>

      {/* XP Progress Bar */}
      {rewards && (
        <div className="lesson-surface-card mb-6 w-full rounded-2xl p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider opacity-70">Cấp độ {rewards.level}</span>
            <span className="text-xs font-black opacity-70">{rewards.totalXp} XP</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-yellow-400 transition-all duration-700"
              style={{ width: `${(rewards.totalXp % 100)}%` }}
            />
          </div>
          <p className="mt-2 text-center text-xs font-bold opacity-60">
            {100 - (rewards.totalXp % 100)} XP để lên cấp {rewards.level + 1}
          </p>
        </div>
      )}

      {/* Next Lesson Unlocked Banner */}
      {rewards?.isNextLessonUnlocked && (
        <div className="mb-6 w-full rounded-xl border-2 border-emerald-400 bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
          🔓 Bài học tiếp theo đã được mở khóa!
        </div>
      )}

      {/* Action Buttons */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        {!isPassed && onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="block w-full rounded-xl bg-emerald-500 px-5 py-4 text-center text-lg font-black uppercase tracking-wider text-white shadow-[0_4px_0_#047857] transition-all hover:bg-emerald-600 active:translate-y-1 active:shadow-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            Làm lại bài học
          </button>
        ) : null}

        <Link
          to={continueUrl}
          className={`block w-full rounded-xl px-5 py-4 text-center text-lg font-black uppercase tracking-wider transition-all cursor-pointer ${
            isPassed
              ? 'bg-emerald-500 text-white shadow-[0_4px_0_#047857] hover:bg-emerald-600 active:translate-y-1 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
          }`}
        >
          {isPassed ? 'Tiếp tục' : 'Về danh sách bài học'}
        </Link>
      </div>
    </main>
  )
}
