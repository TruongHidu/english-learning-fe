import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../components/common/BrandLogo'
import SwipeDeck from '../components/common/SwipeDeck'
import type { SwipeDeckCard } from '../components/common/SwipeDeck'
import './LandingPage.css'

interface DemoWord {
  word: string
  phonetic: string
  type: string
  emoji: string
  meaning: string
  example: string
  exampleMeaning: string
}

const demoWords: DemoWord[] = [
  { word: 'travel', phonetic: '/ˈtræv.əl/', type: 'động từ', emoji: '✈️', meaning: 'đi du lịch', example: 'We travel to Da Nang every summer.', exampleMeaning: 'Chúng tôi đi Đà Nẵng mỗi mùa hè.' },
  { word: 'delicious', phonetic: '/dɪˈlɪʃ.əs/', type: 'tính từ', emoji: '🍜', meaning: 'ngon', example: 'This pho is delicious!', exampleMeaning: 'Bát phở này ngon quá!' },
  { word: 'library', phonetic: '/ˈlaɪ.brer.i/', type: 'danh từ', emoji: '📚', meaning: 'thư viện', example: 'I study at the library.', exampleMeaning: 'Tôi học ở thư viện.' },
  { word: 'brave', phonetic: '/breɪv/', type: 'tính từ', emoji: '🦁', meaning: 'dũng cảm', example: 'She is a brave girl.', exampleMeaning: 'Cô ấy là một cô gái dũng cảm.' },
  { word: 'friendship', phonetic: '/ˈfrend.ʃɪp/', type: 'danh từ', emoji: '🤝', meaning: 'tình bạn', example: 'Our friendship is special.', exampleMeaning: 'Tình bạn của chúng ta thật đặc biệt.' },
]

const marqueeWords = [
  'hello · xin chào', 'apple · quả táo', 'journey · hành trình', 'smile · nụ cười',
  'dream · ước mơ', 'ocean · đại dương', 'coffee · cà phê', 'weekend · cuối tuần',
  'family · gia đình', 'music · âm nhạc', 'success · thành công', 'kind · tốt bụng',
]

const features = [
  {
    icon: '🗺️',
    tone: 'green',
    title: 'Lộ trình từng bước',
    text: 'Khoá học → phần → chủ đề → bài học. Mỗi bài chỉ vài phút, mở khoá dần như một chuyến phiêu lưu.',
  },
  {
    icon: '🧩',
    tone: 'blue',
    title: '5 dạng bài tập',
    text: 'Trắc nghiệm, nối từ, điền chỗ trống, sắp xếp câu và dịch câu — luyện đủ kỹ năng mà không nhàm chán.',
  },
  {
    icon: '🧠',
    tone: 'purple',
    title: 'Ôn tập thông minh',
    text: 'Hệ thống nhắc bạn ôn đúng những từ sắp quên, tập trung vào từ còn yếu để nhớ lâu hơn.',
  },
  {
    icon: '🔥',
    tone: 'orange',
    title: 'Chuỗi ngày & phần thưởng',
    text: 'Nhận XP, kim cương, giữ chuỗi ngày học và lên cấp. Học mỗi ngày trở thành thói quen vui.',
  },
] as const

const journeySteps = [
  { emoji: '👋', title: 'Tạo hồ sơ', text: 'Đăng ký miễn phí chỉ trong 30 giây với email của bạn.' },
  { emoji: '🎯', title: 'Chọn khoá học', text: 'Chọn khoá phù hợp trình độ và bắt đầu từ bài đầu tiên.' },
  { emoji: '⚡', title: 'Học 5 phút mỗi ngày', text: 'Trả lời câu hỏi, nhận XP và giữ tim để đi tiếp.' },
  { emoji: '🃏', title: 'Vuốt thẻ ôn từ', text: 'Lật thẻ, vuốt phải nếu đã nhớ, vuốt trái để ôn lại.' },
  { emoji: '🏆', title: 'Lên cấp & tỏa sáng', text: 'Theo dõi tiến bộ, mở khoá chủ đề mới và chinh phục mục tiêu.' },
]

function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

const demoCards: SwipeDeckCard[] = demoWords.map((item) => ({
  id: item.word,
  front: (
    <>
      <span className="flashcard-tag">{item.type}</span>
      <span className="flashcard-emoji" aria-hidden="true">{item.emoji}</span>
      <p className="flashcard-word">{item.word}</p>
      <span className="flashcard-phonetic">{item.phonetic}</span>
      <button type="button" className="flashcard-speak" onClick={() => speak(item.word)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 10v4h3l4 4V6L8 10H5Zm10-2c1.3 1 2 2.3 2 4s-.7 3-2 4" />
        </svg>
        Nghe phát âm
      </button>
    </>
  ),
  back: (
    <>
      <span className="flashcard-emoji" aria-hidden="true">{item.emoji}</span>
      <p className="flashcard-meaning">{item.meaning}</p>
      <p className="flashcard-example">
        “{item.example}”
        <small>{item.exampleMeaning}</small>
      </p>
    </>
  ),
}))

/** Horizontal carousel: native swipe on touch, drag-to-scroll with a mouse, dots + arrows. */
function JourneyCarousel() {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; scroll: number; moved: boolean } | null>(null)
  const [active, setActive] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    function handleScroll() {
      const slides = Array.from(track!.children) as HTMLElement[]
      const center = track!.scrollLeft + track!.clientWidth / 2
      let closest = 0
      let best = Number.POSITIVE_INFINITY
      slides.forEach((slide, i) => {
        const distance = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center)
        if (distance < best) {
          best = distance
          closest = i
        }
      })
      setActive(closest)
    }
    track.addEventListener('scroll', handleScroll, { passive: true })
    track.addEventListener('scrollend', handleScroll)
    return () => {
      track.removeEventListener('scroll', handleScroll)
      track.removeEventListener('scrollend', handleScroll)
    }
  }, [])

  function scrollToSlide(index: number) {
    const track = trackRef.current
    const slide = track?.children[index] as HTMLElement | undefined
    if (!track || !slide) return
    setActive(index)
    track.scrollTo({ left: slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2, behavior: 'smooth' })
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    dragRef.current = { x: event.clientX, scroll: event.currentTarget.scrollLeft, moved: false }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag) return
    const dx = event.clientX - drag.x
    if (!drag.moved && Math.abs(dx) > 5) {
      drag.moved = true
      setIsDragging(true)
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    if (drag.moved) event.currentTarget.scrollLeft = drag.scroll - dx
  }

  function endDrag() {
    if (!dragRef.current) return
    const moved = dragRef.current.moved
    dragRef.current = null
    if (moved) {
      setIsDragging(false)
      // Let snapping settle on the nearest card after a mouse drag.
      window.requestAnimationFrame(() => scrollToSlide(active))
    }
  }

  return (
    <div className="journey">
      <div
        ref={trackRef}
        className={`journey__track${isDragging ? ' journey__track--dragging' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        aria-label="Các bước bắt đầu"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') scrollToSlide(Math.min(journeySteps.length - 1, active + 1))
          if (event.key === 'ArrowLeft') scrollToSlide(Math.max(0, active - 1))
        }}
      >
        {journeySteps.map((step, index) => (
          <article
            key={step.title}
            className={`journey-card${index === active ? ' journey-card--active' : ''}`}
            style={{ '--i': index } as CSSProperties}
          >
            <span className="journey-card__step">Bước {index + 1}</span>
            <span className="journey-card__emoji" aria-hidden="true">{step.emoji}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        ))}
      </div>

      <div className="journey__nav">
        <button
          type="button"
          className="journey__arrow"
          onClick={() => scrollToSlide(Math.max(0, active - 1))}
          disabled={active === 0}
          aria-label="Bước trước"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
        </button>
        <div className="journey__dots">
          {journeySteps.map((step, index) => (
            <button
              key={step.title}
              type="button"
              className={`journey__dot${index === active ? ' journey__dot--active' : ''}`}
              onClick={() => scrollToSlide(index)}
              aria-label={`Đến bước ${index + 1}`}
              aria-current={index === active ? 'step' : undefined}
            />
          ))}
        </div>
        <button
          type="button"
          className="journey__arrow"
          onClick={() => scrollToSlide(Math.min(journeySteps.length - 1, active + 1))}
          disabled={active === journeySteps.length - 1}
          aria-label="Bước tiếp theo"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  )
}

function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 12)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <main className="landing-page">
      <header className={`landing-header${isScrolled ? ' landing-header--scrolled' : ''}`}>
        <div className="landing-header__inner">
          <Link to="/" className="landing-header__brand" aria-label="LingoFox - Trang chủ">
            <BrandLogo />
          </Link>

          <nav className="landing-nav" aria-label="Mục trên trang">
            <a href="#features">Tính năng</a>
            <a href="#flashcards">Thẻ từ vựng</a>
            <a href="#journey">Bắt đầu</a>
          </nav>

          <div className="landing-header__actions">
            <Link className="header-link" to="/login">Đăng nhập</Link>
            <Link className="action-button action-button--primary action-button--small btn-shine" to="/register">
              Bắt đầu
            </Link>
          </div>
        </div>
      </header>

      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-blob hero-blob--green" aria-hidden="true" />
        <div className="hero-blob hero-blob--blue" aria-hidden="true" />
        <div className="hero-blob hero-blob--gold" aria-hidden="true" />

        <div className="hero-content">
          <span className="hero-pill anim-fade-up">
            <span aria-hidden="true">🦊</span> Học tiếng Anh mỗi ngày chỉ 5 phút
          </span>
          <h1 id="hero-title" className="anim-fade-up" style={{ '--delay': '80ms' } as CSSProperties}>
            Học tiếng Anh <span className="text-gradient">vui như chơi game</span>
          </h1>
          <p className="hero-lead anim-fade-up" style={{ '--delay': '160ms' } as CSSProperties}>
            Bài học ngắn, phản hồi tức thì, thẻ từ vựng vuốt chạm và phần thưởng mỗi ngày —
            giúp bạn tiến bộ đều đặn mà không thấy áp lực.
          </p>

          <div className="hero-actions anim-fade-up" style={{ '--delay': '240ms' } as CSSProperties}>
            <Link className="action-button action-button--primary btn-shine" to="/register">
              BẮT ĐẦU NGAY
            </Link>
            <Link className="action-button action-button--secondary" to="/login">
              TÔI ĐÃ CÓ TÀI KHOẢN
            </Link>
          </div>

          <ul className="hero-perks anim-fade-up" style={{ '--delay': '320ms' } as CSSProperties}>
            <li>Miễn phí để bắt đầu</li>
            <li>Ôn tập thông minh</li>
            <li>Học trên mọi thiết bị</li>
          </ul>
        </div>

        <div className="hero-art-wrap anim-pop" style={{ '--delay': '120ms' } as CSSProperties}>
          <div className="hero-art-glow" aria-hidden="true" />
          <img
            className="hero-art"
            src="/landing-hero-placeholder.svg"
            alt="Minh hoạ các nhân vật học ngôn ngữ vui nhộn"
          />
          <span className="hero-chip hero-chip--hello" aria-hidden="true">Hello! 👋</span>
          <span className="hero-chip hero-chip--xp" aria-hidden="true">⚡ +15 XP</span>
          <span className="hero-chip hero-chip--streak" aria-hidden="true">🔥 7 ngày liên tiếp</span>
          <span className="hero-chip hero-chip--gem" aria-hidden="true">💎 +5</span>
        </div>

        <a className="hero-scroll-cue" href="#features" aria-label="Cuộn xuống để xem tính năng">
          <span />
        </a>
      </section>

      <div className="word-marquee" aria-hidden="true">
        <div className="word-marquee__track">
          {[...marqueeWords, ...marqueeWords].map((word, index) => (
            <span key={`${word}-${index}`}>{word}</span>
          ))}
        </div>
      </div>

      <section id="features" className="landing-section" aria-labelledby="features-title">
        <header className="landing-section__header reveal">
          <span className="section-kicker">Vì sao chọn LingoFox</span>
          <h2 id="features-title">Mọi thứ bạn cần để học đều đặn</h2>
        </header>

        <div className="feature-grid">
          {features.map((feature) => (
            <article key={feature.title} className={`feature-card feature-card--${feature.tone} reveal hover-lift`}>
              <span className="feature-card__icon" aria-hidden="true">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="flashcards" className="landing-section landing-section--tinted" aria-labelledby="flashcards-title">
        <div className="flashcard-showcase">
          <div className="flashcard-showcase__copy reveal">
            <span className="section-kicker">Thử ngay</span>
            <h2 id="flashcards-title">Vuốt thẻ, nhớ từ</h2>
            <p>
              Chạm để lật thẻ xem nghĩa. Vuốt <strong className="tone-green">sang phải</strong> nếu bạn
              đã nhớ, vuốt <strong className="tone-orange">sang trái</strong> để ôn lại sau. Đơn giản như
              lướt điện thoại!
            </p>
            <ul className="check-list">
              <li>Phát âm chuẩn giọng Mỹ</li>
              <li>Ví dụ đi kèm từng từ</li>
              <li>Dùng phím ← → hoặc nút bấm trên máy tính</li>
            </ul>
          </div>

          <div className="flashcard-showcase__deck reveal-pop">
            <SwipeDeck cards={demoCards} ariaLabel="Bộ thẻ từ vựng mẫu" />
          </div>
        </div>
      </section>

      <section id="journey" className="landing-section" aria-labelledby="journey-title">
        <header className="landing-section__header reveal">
          <span className="section-kicker">Hành trình của bạn</span>
          <h2 id="journey-title">Bắt đầu chỉ với vài bước</h2>
          <p>Vuốt hoặc kéo để xem từng bước.</p>
        </header>
        <JourneyCarousel />
      </section>

      <section className="cta-band" aria-labelledby="cta-title">
        <div className="cta-band__inner reveal-pop">
          <span className="cta-band__mascot" aria-hidden="true">🦊</span>
          <h2 id="cta-title">Sẵn sàng cho bài học đầu tiên?</h2>
          <p>Chỉ mất 5 phút. Bạn sẽ ngạc nhiên vì mình học được nhiều thế nào.</p>
          <Link className="action-button action-button--light btn-shine" to="/register">
            TẠO HỒ SƠ MIỄN PHÍ
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <BrandLogo className="landing-footer__brand" />
        <p>© {new Date().getFullYear()} LingoFox · Vừa học vừa chơi</p>
      </footer>
    </main>
  )
}

export default LandingPage
