import { useState } from 'react'
import DataTable from '../../components/admin/DataTable'
import EmptyState from '../../components/admin/EmptyState'
import ErrorState from '../../components/admin/ErrorState'
import LoadingState from '../../components/admin/LoadingState'
import PageHeader from '../../components/admin/PageHeader'
import StatCard from '../../components/admin/StatCard'
import { useAdminLearningStats } from '../../hooks/useAdminLearningStats'
import type { QuestionDifficultyLabel } from '../../types/admin-learning-stats.types'

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return 'Chưa có'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function renderDifficultyBadge(level: QuestionDifficultyLabel) {
  const configs: Record<
    QuestionDifficultyLabel,
    { label: string; className: string }
  > = {
    HIGH: { label: 'SAI NHIỀU (≥70%)', className: 'admin-status--danger' },
    MEDIUM: { label: 'TRUNG BÌNH (40-70%)', className: 'admin-status--warning' },
    LOW: { label: 'THẤP (<40%)', className: 'admin-status--success' },
  }
  const config = configs[level] || configs.LOW
  return (
    <span className={`admin-status ${config.className} admin-status--sm`}>
      <span className="admin-status__dot" aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  )
}

export default function AdminLearningStatsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'streak' | 'xp'>('all')
  const { data, isLoading, isError, error, refetch } = useAdminLearningStats()

  if (isLoading) {
    return (
      <div className="admin-page">
        <PageHeader
          title="Thống kê học tập"
          description="Theo dõi hoạt động và kết quả học tập của học viên."
        />
        <LoadingState label="Đang tải dữ liệu thống kê học tập..." />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="admin-page">
        <PageHeader
          title="Thống kê học tập"
          description="Theo dõi hoạt động và kết quả học tập của học viên."
        />
        <ErrorState
          title="Không thể tải dữ liệu thống kê"
          message={
            error instanceof Error
              ? error.message
              : 'Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng thử lại.'
          }
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  const {
    userSummary,
    lessonSummary,
    topWrongQuestions,
    topLearnedTopics,
    activeUserStats,
    generatedAt,
  } = data

  const currentLearners =
    activeTab === 'streak'
      ? activeUserStats.topByStreak
      : activeTab === 'xp'
        ? activeUserStats.topByXp
        : activeUserStats.topLearners

  return (
    <div className="admin-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <PageHeader
          title="Thống kê học tập"
          description="Theo dõi hoạt động và kết quả học tập của học viên."
        />
        <div className="text-xs text-gray-500 self-start sm:self-center pb-3">
          Cập nhật lúc: <strong>{formatDateTime(generatedAt)}</strong>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <section className="admin-stat-grid" aria-label="Thống kê tổng quan học tập">
        <StatCard
          label="Tổng học viên"
          value={userSummary.totalUsers.toLocaleString('vi-VN')}
          note={`Hôm nay: +${userSummary.activeToday.toLocaleString('vi-VN')} | Tuần này: +${userSummary.newUsersThisWeek.toLocaleString('vi-VN')}`}
          tone="blue"
        />
        <StatCard
          label="Lesson đã hoàn thành"
          value={lessonSummary.completedLessons.toLocaleString('vi-VN')}
          note={`Tổng session: ${lessonSummary.completedSessions.toLocaleString('vi-VN')} | Đang học: ${lessonSummary.inProgressLessons.toLocaleString('vi-VN')}`}
          tone="green"
        />
        <StatCard
          label="Tỷ lệ đạt"
          value={`${lessonSummary.passedRate.toFixed(1)}%`}
          note={`Đạt: ${lessonSummary.passedSessions.toLocaleString('vi-VN')} / ${lessonSummary.completedSessions.toLocaleString('vi-VN')} session (Điểm TB: ${lessonSummary.averageScore.toFixed(1)})`}
          tone="amber"
        />
        <StatCard
          label="Học viên hoạt động hôm nay"
          value={userSummary.activeToday.toLocaleString('vi-VN')}
          note={`7 ngày: ${userSummary.activeLast7Days.toLocaleString('vi-VN')} | 30 ngày: ${userSummary.activeLast30Days.toLocaleString('vi-VN')}`}
          tone="violet"
        />
      </section>

      {/* 2-Column Grid: Top Wrong Questions + Top Topics */}
      <div className="admin-grid-2">
        {/* Left Column: Top Wrong Questions */}
        <section className="admin-card">
          <div className="admin-card__header">
            <div>
              <h2>Top câu hỏi sai nhiều nhất</h2>
              <p>Các câu hỏi học viên thường gặp khó khăn và trả lời sai nhiều nhất.</p>
            </div>
          </div>

          {topWrongQuestions.length === 0 ? (
            <EmptyState
              title="Chưa có dữ liệu câu hỏi sai"
              description="Học viên chưa thực hiện phiên học nào phát sinh câu trả lời sai."
            />
          ) : (
            <DataTable
              headers={[
                'Nội dung câu hỏi',
                'Bài học / Chủ đề',
                'Lượt sai / Tổng',
                'Tỷ lệ sai',
                'Mức độ',
              ]}
              minWidth={600}
            >
              {topWrongQuestions.map((q) => (
                <tr key={q.questionId}>
                  <td style={{ maxWidth: '240px' }}>
                    <div
                      className="font-medium text-gray-900 truncate"
                      title={q.content}
                    >
                      {q.content}
                    </div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                      {q.questionType}
                    </span>
                  </td>
                  <td>
                    <div className="text-sm font-medium text-gray-800">
                      {q.lessonName}
                    </div>
                    <span className="text-xs text-gray-500">{q.topicName}</span>
                  </td>
                  <td>
                    <span className="font-semibold text-rose-600">
                      {q.wrongAttempts.toLocaleString('vi-VN')}
                    </span>
                    <span className="text-gray-400">
                      {' '}
                      / {q.totalAttempts.toLocaleString('vi-VN')}
                    </span>
                  </td>
                  <td>
                    <strong className="text-rose-600">
                      {q.wrongRate.toFixed(1)}%
                    </strong>
                  </td>
                  <td>{renderDifficultyBadge(q.difficultyLabel)}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </section>

        {/* Right Column: Top Learned Topics */}
        <section className="admin-card">
          <div className="admin-card__header">
            <div>
              <h2>Top chủ đề được học nhiều</h2>
              <p>Xếp hạng các Topic có nhiều lượt học và học viên tham gia nhất.</p>
            </div>
          </div>

          {topLearnedTopics.length === 0 ? (
            <EmptyState
              title="Chưa có dữ liệu chủ đề"
              description="Chưa có chủ đề nào phát sinh phiên học."
            />
          ) : (
            <DataTable
              headers={['Hạng', 'Chủ đề', 'Lượt học', 'Học viên', 'Độ phổ biến']}
              minWidth={500}
            >
              {topLearnedTopics.map((topic, index) => (
                <tr key={topic.topicId}>
                  <td style={{ width: '48px' }}>
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        index === 0
                          ? 'bg-amber-100 text-amber-800'
                          : index === 1
                            ? 'bg-slate-200 text-slate-700'
                            : index === 2
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      #{index + 1}
                    </span>
                  </td>
                  <td>
                    <strong className="admin-table__primary">{topic.topicName}</strong>
                  </td>
                  <td>
                    <span>{topic.studyCount.toLocaleString('vi-VN')} lượt</span>
                  </td>
                  <td>
                    <span>{topic.uniqueLearners.toLocaleString('vi-VN')} người</span>
                  </td>
                  <td style={{ minWidth: '130px' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, topic.percentage))}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 w-10 text-right">
                        {topic.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </section>
      </div>

      {/* Active Learners Section */}
      <section className="admin-card">
        <div className="admin-card__header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2>Học viên hoạt động tích cực</h2>
            <p>Danh sách học viên chăm chỉ và đạt thành tích cao trong hệ thống.</p>
          </div>

          <div className="inline-flex rounded-lg bg-gray-100 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-gray-900 shadow-xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Hoạt động gần đây
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('streak')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'streak'
                  ? 'bg-white text-gray-900 shadow-xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Chuỗi Streak 🔥
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('xp')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'xp'
                  ? 'bg-white text-gray-900 shadow-xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Nhiều XP ⭐
            </button>
          </div>
        </div>

        {currentLearners.length === 0 ? (
          <EmptyState
            title="Chưa có học viên nào"
            description="Chưa có dữ liệu học viên hoạt động trong danh sách này."
          />
        ) : (
          <DataTable
            headers={[
              'Học viên',
              'Email',
              'Level',
              'XP',
              'Streak',
              'Lesson hoàn thành',
              'Ngày học gần nhất',
            ]}
            minWidth={650}
          >
            {currentLearners.map((u) => {
              const initials = u.fullName?.trim()?.charAt(0)?.toUpperCase() || 'U'
              return (
                <tr key={u.userId}>
                  <td>
                    <div className="flex items-center gap-3">
                      {u.avatarUrl ? (
                        <img
                          src={u.avatarUrl}
                          alt={u.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200">
                          {initials}
                        </span>
                      )}
                      <strong className="admin-table__primary">{u.fullName}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="text-gray-600">{u.email}</span>
                  </td>
                  <td>
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      Lv.{u.level}
                    </span>
                  </td>
                  <td>
                    <span className="font-semibold text-amber-600">
                      {u.xp.toLocaleString('vi-VN')} ⭐
                    </span>
                  </td>
                  <td>
                    <span className="font-semibold text-rose-600 flex items-center gap-1">
                      {u.streak} ngày 🔥
                    </span>
                  </td>
                  <td>
                    <span className="font-medium text-emerald-700">
                      {u.completedLessons.toLocaleString('vi-VN')} bài
                    </span>
                  </td>
                  <td>
                    <span className="text-gray-500 text-xs">
                      {formatDateTime(u.lastStudyDate)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </DataTable>
        )}
      </section>
    </div>
  )
}
