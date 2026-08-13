import { useEffect, useRef, useState } from 'react'
import type { FocusEvent } from 'react'
import SidebarIcon from './SidebarIcon'

interface MoreMenuProps {
  onLogout(): void
}

function EnglishTestIcon() {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="15" className="more-product-icon__burst" />
      <path d="m11 19 4 4 10-11" className="more-product-icon__check" />
    </svg>
  )
}

function SchoolsIcon() {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="17" r="13" className="more-product-icon__globe" />
      <path d="M8 13c5 2 8-1 9-6m11 7c-4 1-6 4-5 9m-12 3c4-2 8 0 10 4" className="more-product-icon__land" />
      <path d="M18 30v4M12 34h12" className="more-product-icon__stand" />
    </svg>
  )
}

export default function MoreMenu({ onLogout }: MoreMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isPinned, setIsPinned] = useState(false)

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

  function closeMenu() {
    setIsOpen(false)
    setIsPinned(false)
  }

  function handleLogout() {
    closeMenu()
    onLogout()
  }

  return (
    <div
      ref={containerRef}
      className={`more-menu${isOpen ? ' more-menu--open' : ''}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => {
        if (!isPinned) setIsOpen(false)
      }}
      onFocus={() => setIsOpen(true)}
      onBlur={handleBlur}
    >
      <button
        className="sidebar-link more-menu__trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="sidebar-more-menu"
        onClick={toggleMenu}
      >
        <span className="sidebar-icon sidebar-icon--more">
          <SidebarIcon name="more" />
        </span>
        <span>XEM THÊM</span>
      </button>

      {isOpen && (
        <div id="sidebar-more-menu" className="more-popover" role="menu">
          <div className="more-popover__products">
            <button type="button" role="menuitem" onClick={closeMenu}>
              <span className="more-product-icon"><EnglishTestIcon /></span>
              <span>DUOLINGO ENGLISH TEST</span>
            </button>
            <button type="button" role="menuitem" onClick={closeMenu}>
              <span className="more-product-icon"><SchoolsIcon /></span>
              <span>SCHOOLS</span>
            </button>
          </div>

          <div className="more-popover__links">
            <button type="button" role="menuitem" onClick={closeMenu}>CÀI ĐẶT</button>
            <button type="button" role="menuitem" onClick={closeMenu}>TRỢ GIÚP</button>
            <button type="button" role="menuitem" onClick={handleLogout}>ĐĂNG XUẤT</button>
          </div>
        </div>
      )}
    </div>
  )
}
