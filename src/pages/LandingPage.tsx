import { Link } from 'react-router-dom'
import './LandingPage.css'

function BrandMark() {
  return (
    <div className="brand" aria-label="LingoFox">
      <svg
        className="brand__icon"
        viewBox="0 0 48 48"
        aria-hidden="true"
      >
        <path d="M8 17 3 10l10 1C15.6 7.8 19.5 6 24 6s8.4 1.8 11 5l10-1-5 8v9c0 9-7.2 15-16 15S8 36 8 27V17Z" />
        <circle cx="17" cy="23" r="4" className="brand__eye" />
        <circle cx="31" cy="23" r="4" className="brand__eye" />
        <path d="m20 30 4 5 4-5Z" className="brand__beak" />
      </svg>
      <span>lingofox</span>
    </div>
  )
}

function LandingPage() {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <BrandMark />

        <button className="language-picker" type="button">
          <span>NGÔN NGỮ HIỂN THỊ: TIẾNG VIỆT</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m5 9 7 7 7-7" />
          </svg>
        </button>
      </header>

      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-art-wrap">
          <img
            className="hero-art"
            src="/landing-hero-placeholder.svg"
            alt="Minh hoạ các nhân vật học ngôn ngữ vui nhộn"
          />
        </div>

        <div className="hero-content">
          <h1 id="hero-title">
            Học ngôn ngữ, cờ vua và nhiều bộ
            <br />
            môn khác theo cách vui nhất!
          </h1>

          <div className="hero-actions">
            <Link className="action-button action-button--primary" to="/register">
              BẮT ĐẦU
            </Link>
            <Link className="action-button action-button--secondary" to="/login">
              TÔI ĐÃ CÓ TÀI KHOẢN
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default LandingPage
