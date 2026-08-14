import { Link, useLocation } from 'react-router-dom'
import LoginForm from '../../components/auth/LoginForm'
import RegisterForm from '../../components/auth/RegisterForm'
import './AuthPage.css'

type AuthMode = 'login' | 'register'

interface AuthPageProps {
  mode: AuthMode
}

interface AuthNavigationState {
  flashMessage?: string
  from?: string
  registeredEmail?: string
}

function getNavigationState(value: unknown): AuthNavigationState {
  if (typeof value !== 'object' || value === null) return {}
  const state = value as Record<string, unknown>

  return {
    flashMessage: typeof state.flashMessage === 'string' ? state.flashMessage : undefined,
    from: typeof state.from === 'string' ? state.from : undefined,
    registeredEmail:
      typeof state.registeredEmail === 'string' ? state.registeredEmail : undefined,
  }
}

function GoogleIcon() {
  return (
    <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285f4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4Z" />
      <path fill="#34a853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1a5.8 5.8 0 0 1-5.4-4H3.3v2.6A10 10 0 0 0 12 22Z" />
      <path fill="#fbbc05" d="M6.6 14a6 6 0 0 1 0-3.9V7.5H3.3a10 10 0 0 0 0 9.2L6.6 14Z" />
      <path fill="#ea4335" d="M12 6.1c1.6 0 3 .5 4.1 1.6L19 4.9A9.8 9.8 0 0 0 3.3 7.5l3.3 2.6a5.8 5.8 0 0 1 5.4-4Z" />
    </svg>
  )
}

function FacebookIcon() {
  return <span className="facebook-icon" aria-hidden="true">f</span>
}

export default function AuthPage({ mode }: AuthPageProps) {
  const location = useLocation()
  const state = getNavigationState(location.state as unknown)
  const isLogin = mode === 'login'

  return (
    <main className="auth-page">
      <Link className="auth-close" to="/" aria-label="Quay về trang chủ">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {isLogin ? (
            <path d="M5 5l14 14M19 5 5 19" />
          ) : (
            <path d="m14.5 5-7 7 7 7M8 12h11" />
          )}
        </svg>
      </Link>

      <Link
        className="auth-switch"
        to={isLogin ? '/register' : '/login'}
        state={{ from: state.from }}
      >
        {isLogin ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP'}
      </Link>

      <section className="auth-panel" aria-labelledby="auth-title">
        <h1 id="auth-title">{isLogin ? 'Đăng nhập' : 'Tạo hồ sơ'}</h1>

        {state.flashMessage && (
          <div className="form-alert form-alert--success" role="status">
            {state.flashMessage}
          </div>
        )}

        {isLogin ? (
          <LoginForm initialEmail={state.registeredEmail} returnTo={state.from} />
        ) : (
          <RegisterForm returnTo={state.from} />
        )}

        <div className="auth-divider"><span>HOẶC</span></div>

        <div className="social-actions">
          <button type="button" disabled title="Đăng nhập Google chưa được backend hỗ trợ">
            <GoogleIcon /> GOOGLE
          </button>
          <button type="button" disabled title="Đăng nhập Facebook chưa được backend hỗ trợ">
            <FacebookIcon /> FACEBOOK
          </button>
        </div>

        <div className="auth-legal">
          <p>
            Khi đăng ký trên LingoFox, bạn đã đồng ý với <strong>Các chính sách</strong> và
            <br /> <strong>Chính sách bảo mật</strong> của chúng tôi.
          </p>
          <p>
            Trang này được reCAPTCHA Enterprise bảo hộ và theo <strong>Chính sách</strong>
            <br /> <strong>bảo mật</strong> và <strong>Điều khoản dịch vụ</strong> của Google.
          </p>
        </div>
      </section>
    </main>
  )
}
