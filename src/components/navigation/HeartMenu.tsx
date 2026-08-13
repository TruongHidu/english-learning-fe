import { useEffect, useRef, useState } from 'react'
import type { FocusEvent } from 'react'

interface HeartMenuProps {
  currentHeart: number
  maxHeart: number
}

function HeartIcon({ filled = true }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        className={filled ? 'heart-shape heart-shape--filled' : 'heart-shape heart-shape--empty'}
        d="M12 21S3 16 3 9.5C3 6 7.4 4 10 7l2 2 2-2c2.6-3 7-1 7 2.5C21 16 12 21 12 21Z"
      />
    </svg>
  )
}

function InfiniteHeartIcon() {
  return (
    <span className="heart-offer-icon heart-offer-icon--infinite" aria-hidden="true">
      ∞
    </span>
  )
}

function EmptyHeartIcon() {
  return (
    <span className="heart-offer-icon heart-offer-icon--empty" aria-hidden="true">
      <HeartIcon filled={false} />
    </span>
  )
}

function SmallGemIcon() {
  return (
    <svg className="heart-cost-gem" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 3-4 5v9l9 5 9-5V8l-4-5H7Z" />
      <path d="m8 6-2 3v6l6 3.5 6-3.5V9l-2-3H8Z" />
    </svg>
  )
}

export default function HeartMenu({ currentHeart, maxHeart }: HeartMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const safeMaxHeart = Math.max(0, Math.min(Math.trunc(maxHeart), 20))
  const safeCurrentHeart = Math.max(0, Math.min(Math.trunc(currentHeart), safeMaxHeart))
  const isFull = safeMaxHeart > 0 && safeCurrentHeart >= safeMaxHeart
  const isEmpty = safeCurrentHeart === 0

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current?.contains(event.target as Node)) return
      setIsOpen(false)
      setIsPinned(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setIsOpen(false)
      setIsPinned(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function handleMouseEnter() {
    if (!isPinned) setIsOpen(true)
  }

  function handleMouseLeave() {
    if (!isPinned) setIsOpen(false)
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget)) return
    setIsOpen(false)
    setIsPinned(false)
  }

  function toggleMenu() {
    if (isPinned) {
      setIsPinned(false)
      setIsOpen(false)
      return
    }

    setIsPinned(true)
    setIsOpen(true)
  }

  const statusTitle = isFull
    ? 'Bạn có đầy đủ trái tim'
    : isEmpty
      ? 'Bạn đã hết trái tim'
      : `Bạn còn ${safeCurrentHeart} trái tim`
  const statusDescription = isEmpty ? 'Hồi phục để tiếp tục học' : 'Tiếp tục học'

  return (
    <div
      ref={containerRef}
      className={`heart-menu${isOpen ? ' heart-menu--open' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setIsOpen(true)}
      onBlur={handleBlur}
    >
      <button
        className="stat-item stat-item--heart heart-menu__trigger"
        type="button"
        aria-label={`${currentHeart} trên ${maxHeart} trái tim`}
        aria-expanded={isOpen}
        aria-controls="heart-popover"
        onClick={toggleMenu}
      >
        <HeartIcon />
        <strong>{currentHeart}</strong>
      </button>

      {isOpen && (
        <section
          id="heart-popover"
          className="heart-popover"
          role="dialog"
          aria-labelledby="heart-popover-title"
        >
          <h2 id="heart-popover-title">Trái tim</h2>

          <div className="heart-list" aria-label={`${safeCurrentHeart} trên ${safeMaxHeart} trái tim`}>
            {Array.from({ length: safeMaxHeart }, (_, index) => (
              <span key={index} className="heart-list__item">
                <HeartIcon filled={index < safeCurrentHeart} />
              </span>
            ))}
          </div>

          <h3>{statusTitle}</h3>
          <p className="heart-popover__status">{statusDescription}</p>

          <div className="heart-offers">
            <div className="heart-offer">
              <InfiniteHeartIcon />
              <strong>TRÁI TIM VÔ HẠN</strong>
              <span className="heart-offer__free">THỬ MIỄN PHÍ</span>
            </div>
            <div className="heart-offer">
              <EmptyHeartIcon />
              <strong>HỒI PHỤC TRÁI TIM</strong>
              <span className="heart-offer__cost"><SmallGemIcon /> 350</span>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
