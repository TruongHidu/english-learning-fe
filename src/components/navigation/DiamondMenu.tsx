import { useEffect, useRef, useState } from 'react'
import type { FocusEvent } from 'react'
import { useNavigate } from 'react-router-dom'

interface DiamondMenuProps {
  diamond: number
}

function GemIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 3-4 5v9l9 5 9-5V8l-4-5H7Z" />
      <path d="m8 6-2 3v6l6 3.5 6-3.5V9l-2-3H8Z" />
    </svg>
  )
}

function DiamondChestIllustration() {
  return (
    <svg
      className="diamond-chest-svg"
      viewBox="0 0 108 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Open Lid in background */}
      <path
        d="M12 42C12 24 24 16 54 16C84 16 96 24 96 42H12Z"
        fill="#804216"
      />
      <path
        d="M16 42C16 26 26 20 54 20C82 20 92 26 92 42H16Z"
        fill="#5a2c0c"
      />
      {/* Gold trim on lid rim */}
      <path
        d="M12 42H96V46H12V42Z"
        fill="#e5a500"
      />

      {/* Overflowing Blue Gems / Crystals */}
      {/* Gem left-back */}
      <polygon points="26,38 38,24 50,34 44,48 30,48" fill="#00b4d8" />
      <polygon points="38,24 50,34 44,48 38,36" fill="#90e0ef" />
      <polygon points="26,38 38,24 38,36 30,48" fill="#48cae4" />

      {/* Gem top-center */}
      <polygon points="46,30 58,14 70,30 64,46 52,46" fill="#1cb0f6" />
      <polygon points="58,14 70,30 64,46 58,32" fill="#bae6fd" />
      <polygon points="46,30 58,14 58,32 52,46" fill="#38bdf8" />

      {/* Gem right-back */}
      <polygon points="66,36 78,22 90,36 84,50 72,50" fill="#0284c7" />
      <polygon points="78,22 90,36 84,50 78,34" fill="#7dd3fc" />
      <polygon points="66,36 78,22 78,34 72,50" fill="#0369a1" />

      {/* Gem mid-left */}
      <polygon points="18,48 32,38 46,48 40,60 24,60" fill="#1cb0f6" />
      <polygon points="32,38 46,48 40,60 32,48" fill="#7dd3fc" />
      <polygon points="18,48 32,38 32,48 24,60" fill="#0284c7" />

      {/* Gem center-front */}
      <polygon points="38,44 54,34 70,44 64,58 44,58" fill="#38bdf8" />
      <polygon points="54,34 70,44 64,58 54,46" fill="#e0f2fe" />
      <polygon points="38,44 54,34 54,46 44,58" fill="#0ea5e9" />

      {/* Gem mid-right */}
      <polygon points="64,46 78,36 92,46 86,58 70,58" fill="#00cd9c" />
      <polygon points="78,36 92,46 86,58 78,46" fill="#a7f3d0" />
      <polygon points="64,46 78,36 78,46 70,58" fill="#10b981" />

      {/* Sparkles */}
      <circle cx="36" cy="22" r="2" fill="#ffffff" />
      <circle cx="76" cy="18" r="2.5" fill="#ffffff" />
      <circle cx="56" cy="12" r="1.5" fill="#ffffff" />

      {/* Chest Body (Warm Wood) */}
      <rect x="10" y="46" width="88" height="42" rx="7" fill="#a05721" />

      {/* Wood Planks Divider Lines */}
      <line x1="10" y1="60" x2="98" y2="60" stroke="#71370b" strokeWidth="2.5" />
      <line x1="10" y1="74" x2="98" y2="74" stroke="#71370b" strokeWidth="2.5" />

      {/* Golden Corner Reinforcements & Trims */}
      <path
        d="M17 46H10V81C10 84.866 13.134 88 17 88H20V46H17Z"
        fill="#ffc800"
      />
      <rect x="12" y="48" width="5" height="38" rx="1" fill="#ffe270" />

      <path
        d="M91 46H98V81C98 84.866 94.866 88 91 88H88V46H91Z"
        fill="#ffc800"
      />
      <rect x="91" y="48" width="5" height="38" rx="1" fill="#ffe270" />

      <rect x="10" y="46" width="88" height="5" fill="#e5a500" />
      <rect x="12" y="46" width="84" height="2" fill="#ffe270" />

      <rect x="10" y="84" width="88" height="4" rx="2" fill="#d49400" />

      {/* Center Lock Latch (Gold with Keyhole) */}
      <rect x="45" y="45" width="18" height="20" rx="3.5" fill="#ffc800" stroke="#d49400" strokeWidth="1.5" />
      <rect x="47" y="47" width="14" height="6" rx="1.5" fill="#fff099" />
      <circle cx="54" cy="54" r="2.5" fill="#4d2906" />
      <polygon points="52.8,54 55.2,54 56,60 52,60" fill="#4d2906" />
    </svg>
  )
}

export default function DiamondMenu({ diamond }: DiamondMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const closeTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current?.contains(event.target as Node)) return
      setIsOpen(false)
      setIsPinned(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setIsPinned(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  function handleMouseEnter() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    if (!isPinned) {
      setIsOpen(true)
    }
  }

  function handleMouseLeave() {
    if (isPinned) return
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(false)
    }, 150)
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

  function handleGoToShop() {
    setIsOpen(false)
    setIsPinned(false)
    navigate('/shop')
  }

  return (
    <div
      ref={containerRef}
      className={`diamond-menu${isOpen ? ' diamond-menu--open' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setIsOpen(true)}
      onBlur={handleBlur}
    >
      <button
        className="stat-item stat-item--diamond diamond-menu__trigger"
        type="button"
        aria-label={`${diamond} đá quý`}
        aria-expanded={isOpen}
        aria-controls="diamond-popover"
        onClick={toggleMenu}
      >
        <GemIcon />
        <strong>{diamond}</strong>
      </button>

      {isOpen && (
        <section
          id="diamond-popover"
          className="diamond-popover"
          role="dialog"
          aria-labelledby="diamond-popover-title"
        >
          <div className="diamond-popover__card">
            <div className="diamond-popover__chest-container">
              <DiamondChestIllustration />
            </div>

            <div className="diamond-popover__info">
              <h2 id="diamond-popover-title" className="diamond-popover__title">
                Đá quý
              </h2>
              <p className="diamond-popover__status">
                Bạn có {diamond} đá quý
              </p>
              <button
                type="button"
                className="diamond-popover__shop-link"
                onClick={handleGoToShop}
              >
                VÀO XEM CỬA HÀNG
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
