import type { UserProfileStats } from '../../types/user.types'

interface StatItem {
  label: string
  value: string
  icon: string
}

export default function ProfileStats({ stats }: { stats: UserProfileStats }) {
  const formatNumber = (value: number) => value.toLocaleString('vi-VN')
  const items: StatItem[] = [
    { label: 'Trái tim', value: `${stats.currentHeart} / ${stats.maxHeart}`, icon: '♥' },
    { label: 'Kim cương', value: formatNumber(stats.diamond), icon: '◆' },
    { label: 'Tổng KN', value: formatNumber(stats.totalXp), icon: '★' },
    { label: 'Cấp độ', value: formatNumber(stats.level), icon: '▲' },
    { label: 'Chuỗi hiện tại', value: `${formatNumber(stats.currentStreak)} ngày`, icon: '●' },
    { label: 'Chuỗi dài nhất', value: `${formatNumber(stats.longestStreak)} ngày`, icon: '♛' },
  ]

  return (
    <section className="profile-section" aria-labelledby="profile-stats-title">
      <div className="profile-section__heading">
        <div>
          <span>TIẾN ĐỘ HỌC TẬP</span>
          <h2 id="profile-stats-title">Thống kê</h2>
        </div>
      </div>
      <div className="profile-stats-grid">
        {items.map((item, index) => (
          <article className={`profile-stat profile-stat--${index + 1}`} key={item.label}>
            <span className="profile-stat__icon" aria-hidden="true">{item.icon}</span>
            <div>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
