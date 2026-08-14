import type { UserProfile } from '../../types/user.types'

function formatJoinedDate(createdAt: string): string {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return 'Không xác định'

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function getProviderLabel(provider: UserProfile['authProvider']): string {
  return provider === 'GOOGLE' ? 'Google' : 'Email và mật khẩu'
}

function getRoleLabel(role: UserProfile['role']): string {
  return role === 'ADMIN' ? 'Quản trị viên' : 'Học viên'
}

function getStatusLabel(status: UserProfile['status']): string {
  if (status === 'LOCKED') return 'Đã khóa'
  if (status === 'BANNED') return 'Đã cấm'
  return 'Đang hoạt động'
}

export default function ProfileHeader({ profile }: { profile: UserProfile }) {
  const fallbackLetter = profile.displayName.trim().charAt(0).toUpperCase() || 'U'

  return (
    <section className="profile-header-card" aria-labelledby="profile-name">
      <div className="profile-avatar">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt={`Ảnh đại diện của ${profile.displayName}`} />
        ) : (
          <span role="img" aria-label={`Ảnh đại diện mặc định của ${profile.displayName}`}>
            {fallbackLetter}
          </span>
        )}
      </div>

      <div className="profile-identity">
        <h1 id="profile-name">{profile.displayName}</h1>
        <p>{profile.email}</p>
        <div className="profile-badges" aria-label="Thông tin tài khoản">
          <span>{getProviderLabel(profile.authProvider)}</span>
          <span>{getRoleLabel(profile.role)}</span>
          <span className={`profile-status profile-status--${profile.status.toLowerCase()}`}>
            {getStatusLabel(profile.status)}
          </span>
        </div>
        <p className="profile-joined">Tham gia ngày {formatJoinedDate(profile.createdAt)}</p>
      </div>
    </section>
  )
}
