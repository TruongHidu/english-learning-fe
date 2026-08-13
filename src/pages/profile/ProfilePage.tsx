import ChangePasswordForm from '../../components/profile/ChangePasswordForm'
import ProfileHeader from '../../components/profile/ProfileHeader'
import ProfileStats from '../../components/profile/ProfileStats'
import UpdateDisplayNameForm from '../../components/profile/UpdateDisplayNameForm'
import { useProfile } from '../../hooks/useProfile'
import type { UserProfile } from '../../types/user.types'
import './ProfilePage.css'

function formatJoinedYear(createdAt: string): string {
  const date = new Date(createdAt)
  return Number.isNaN(date.getTime()) ? '—' : String(date.getFullYear())
}

function getProviderDescription(profile: UserProfile): string {
  return profile.authProvider === 'GOOGLE'
    ? 'Tài khoản được liên kết và xác thực bằng Google.'
    : 'Tài khoản sử dụng email và mật khẩu để đăng nhập.'
}

function ProfileLoading() {
  return (
    <>
      <main className="profile-main" aria-busy="true" aria-label="Đang tải hồ sơ">
        <div className="profile-skeleton profile-skeleton--header" />
        <div className="profile-skeleton profile-skeleton--stats" />
        <div className="profile-skeleton profile-skeleton--form" />
      </main>
      <aside className="right-rail profile-right-rail" aria-hidden="true">
        <div className="profile-skeleton profile-skeleton--side" />
        <div className="profile-skeleton profile-skeleton--side" />
      </aside>
    </>
  )
}

function ProfileError({ message, onRetry }: { message: string; onRetry(): void }) {
  return (
    <>
      <main className="profile-main">
        <section className="profile-load-error" role="alert">
          <span aria-hidden="true">!</span>
          <h1>Không thể tải hồ sơ</h1>
          <p>{message}</p>
          <button type="button" onClick={onRetry}>THỬ LẠI</button>
        </section>
      </main>
      <aside className="right-rail profile-right-rail" aria-label="Thông tin hồ sơ">
        <article className="sample-card">
          <span className="sample-card__eyebrow">HỒ SƠ</span>
          <h2>Dữ liệu chưa khả dụng</h2>
          <p>Hãy thử tải lại để xem thông tin tài khoản mới nhất.</p>
        </article>
      </aside>
    </>
  )
}

export default function ProfilePage() {
  const { error, isLoading, mergeUpdatedName, profile, retry } = useProfile()

  if (isLoading) return <ProfileLoading />
  if (error || !profile) {
    return <ProfileError message={error ?? 'Không tìm thấy dữ liệu hồ sơ.'} onRetry={() => void retry()} />
  }

  return (
    <>
      <main className="profile-main">
        <ProfileHeader profile={profile} />
        <ProfileStats stats={profile.stats} />
        <UpdateDisplayNameForm
          displayName={profile.displayName}
          onUpdated={mergeUpdatedName}
        />
        {profile.authProvider === 'GOOGLE' ? (
          <section className="profile-section" aria-labelledby="google-password-title">
            <div className="profile-section__heading">
              <div>
                <span>BẢO MẬT</span>
                <h2 id="google-password-title">Đổi mật khẩu</h2>
              </div>
            </div>
            <div className="profile-provider-notice" role="status">
              <span aria-hidden="true">G</span>
              <p>Tài khoản Google không hỗ trợ đổi mật khẩu tại đây.</p>
            </div>
          </section>
        ) : (
          <ChangePasswordForm />
        )}
      </main>

      <aside className="right-rail profile-right-rail" aria-label="Tổng quan hồ sơ">
        <article className="sample-card profile-summary-card">
          <span className="sample-card__eyebrow">TÀI KHOẢN</span>
          <h2>{profile.authProvider === 'GOOGLE' ? 'Google' : 'Tài khoản Local'}</h2>
          <p>{getProviderDescription(profile)}</p>
          <dl className="profile-summary-list">
            <div><dt>Vai trò</dt><dd>{profile.role}</dd></div>
            <div><dt>Trạng thái</dt><dd>{profile.status}</dd></div>
            <div><dt>Năm tham gia</dt><dd>{formatJoinedYear(profile.createdAt)}</dd></div>
          </dl>
        </article>

        <article className="sample-card profile-summary-card">
          <span className="sample-card__eyebrow">THÀNH TÍCH</span>
          <h2>Cấp độ {profile.stats.level}</h2>
          <p>Bạn đã tích lũy {profile.stats.totalXp.toLocaleString('vi-VN')} KN.</p>
          <div className="profile-highlight">
            <span>Chuỗi dài nhất</span>
            <strong>{profile.stats.longestStreak} ngày</strong>
          </div>
        </article>
      </aside>
    </>
  )
}
