import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from 'react'
import './SwipeDeck.css'

export type SwipeDirection = 'left' | 'right'

export interface SwipeDeckCard {
  id: string
  front: ReactNode
  back: ReactNode
}

interface SwipeDeckProps {
  /** Give the deck a `key` that changes with the card set to restart it. */
  cards: SwipeDeckCard[]
  leftLabel?: string
  rightLabel?: string
  onSwipe?: (card: SwipeDeckCard, direction: SwipeDirection) => void
  className?: string
  ariaLabel?: string
}

const COMMIT_DISTANCE = 110
const COMMIT_VELOCITY = 0.55 // px per ms
const EXIT_MS = 320

interface DragState {
  startX: number
  startY: number
  startTime: number
  x: number
  y: number
  moved: boolean
  pointerId: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export default function SwipeDeck({
  cards,
  leftLabel = 'Học lại',
  rightLabel = 'Đã nhớ',
  onSwipe,
  className = '',
  ariaLabel = 'Bộ thẻ ghi nhớ',
}: SwipeDeckProps) {
  const [queue, setQueue] = useState<SwipeDeckCard[]>(cards)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [exiting, setExiting] = useState<SwipeDirection | null>(null)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [missed, setMissed] = useState<SwipeDeckCard[]>([])
  const [knownCount, setKnownCount] = useState(0)
  const drag = useRef<DragState | null>(null)
  const exitTimer = useRef<number | null>(null)

  useEffect(() => () => {
    if (exitTimer.current) window.clearTimeout(exitTimer.current)
  }, [])

  const current = queue[index]
  const isFinished = index >= queue.length

  function commit(direction: SwipeDirection) {
    if (!current || exiting) return
    setHasInteracted(true)
    setExiting(direction)
    setIsDragging(false)
    onSwipe?.(current, direction)
    if (direction === 'right') setKnownCount((n) => n + 1)
    else setMissed((list) => [...list, current])

    exitTimer.current = window.setTimeout(() => {
      setIndex((i) => i + 1)
      setExiting(null)
      setFlipped(false)
      setOffset({ x: 0, y: 0 })
    }, EXIT_MS)
  }

  function restart(nextQueue: SwipeDeckCard[]) {
    setQueue(nextQueue)
    setIndex(0)
    setMissed([])
    setKnownCount(0)
    setFlipped(false)
    setOffset({ x: 0, y: 0 })
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (exiting || event.button !== 0) return
    // Buttons inside a card (e.g. pronounce) keep their own click behaviour.
    if ((event.target as Element).closest('button, a, input')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setHasInteracted(true)
    drag.current = {
      startX: event.clientX,
      startY: event.clientY,
      startTime: performance.now(),
      x: 0,
      y: 0,
      moved: false,
      pointerId: event.pointerId,
    }
    setIsDragging(true)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current
    if (!state || state.pointerId !== event.pointerId) return
    state.x = event.clientX - state.startX
    state.y = event.clientY - state.startY
    if (!state.moved && Math.hypot(state.x, state.y) > 6) state.moved = true
    if (state.moved) setOffset({ x: state.x, y: state.y })
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current
    if (!state || state.pointerId !== event.pointerId) return
    drag.current = null
    setIsDragging(false)

    if (!state.moved) {
      setHasInteracted(true)
      setFlipped((value) => !value)
      return
    }

    const velocity = Math.abs(state.x) / Math.max(1, performance.now() - state.startTime)
    if (Math.abs(state.x) > COMMIT_DISTANCE || (velocity > COMMIT_VELOCITY && Math.abs(state.x) > 40)) {
      commit(state.x > 0 ? 'right' : 'left')
    } else {
      setOffset({ x: 0, y: 0 })
    }
  }

  function handlePointerCancel() {
    drag.current = null
    setIsDragging(false)
    setOffset({ x: 0, y: 0 })
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (isFinished) return
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      commit('right')
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      commit('left')
    } else if (event.key === ' ' || event.key === 'Enter') {
      if ((event.target as Element).closest('button')) return
      event.preventDefault()
      setHasInteracted(true)
      setFlipped((value) => !value)
    }
  }

  if (queue.length === 0) return null

  const exitX = exiting === 'right' ? 1 : exiting === 'left' ? -1 : 0
  const dragX = exiting ? exitX * 640 : offset.x
  const dragY = exiting ? offset.y * 0.4 + 40 : offset.y * 0.25
  const rotation = exiting ? exitX * 22 : clamp(offset.x / 16, -18, 18)
  const intent = exiting ? exitX : clamp(offset.x / COMMIT_DISTANCE, -1, 1)
  const progress = Math.min(index, queue.length)

  const topStyle = {
    transform: `translate3d(${dragX}px, ${dragY}px, 0) rotate(${rotation}deg)`,
    transition: isDragging ? 'none' : undefined,
    opacity: exiting ? 0 : 1,
    '--intent-right': Math.max(0, intent),
    '--intent-left': Math.max(0, -intent),
  } as CSSProperties

  return (
    <div
      className={`swipe-deck ${className}`}
      role="group"
      aria-roledescription="bộ thẻ"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      data-swipe-ignore
    >
      <div className="swipe-deck__meta">
        <span aria-live="polite">
          {isFinished ? 'Hoàn thành' : `Thẻ ${progress + 1} / ${queue.length}`}
        </span>
        <div className="swipe-deck__progress" aria-hidden="true">
          <i style={{ width: `${(progress / queue.length) * 100}%` }} />
        </div>
      </div>

      <div className="swipe-deck__stack">
        {isFinished ? (
          <div className="swipe-deck__done">
            <span className="swipe-deck__done-icon" aria-hidden="true">🎉</span>
            <strong>
              Bạn đã nhớ {knownCount}/{queue.length} thẻ
            </strong>
            <p>
              {missed.length > 0
                ? `Còn ${missed.length} thẻ cần ôn thêm. Thử lại ngay nhé!`
                : 'Tuyệt vời! Bạn đã nhớ hết bộ thẻ này.'}
            </p>
            <div className="swipe-deck__done-actions">
              {missed.length > 0 ? (
                <button type="button" className="swipe-deck__btn swipe-deck__btn--primary" onClick={() => restart(missed)}>
                  Ôn {missed.length} thẻ chưa nhớ
                </button>
              ) : null}
              <button type="button" className="swipe-deck__btn" onClick={() => restart(cards)}>
                Làm lại từ đầu
              </button>
            </div>
          </div>
        ) : (
          queue.slice(index, index + 3).map((card, depth) => {
            const isTop = depth === 0
            if (!isTop) {
              return (
                <div
                  key={card.id}
                  className="swipe-card swipe-card--behind"
                  style={{ '--depth': exiting ? depth - 1 : depth } as CSSProperties}
                  aria-hidden="true"
                >
                  <div className="swipe-card__face swipe-card__face--front">{card.front}</div>
                </div>
              )
            }

            return (
              <div
                key={card.id}
                className={`swipe-card swipe-card--top${hasInteracted ? '' : ' swipe-card--hint'}`}
                style={topStyle}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
              >
                <div className={`swipe-card__inner${flipped ? ' swipe-card__inner--flipped' : ''}`}>
                  <div className="swipe-card__face swipe-card__face--front" aria-hidden={flipped}>
                    {card.front}
                    <span className="swipe-card__tap-hint">Chạm để lật thẻ</span>
                  </div>
                  <div className="swipe-card__face swipe-card__face--back" aria-hidden={!flipped}>
                    {card.back}
                  </div>
                </div>
                <span className="swipe-card__stamp swipe-card__stamp--right" aria-hidden="true">
                  {rightLabel}
                </span>
                <span className="swipe-card__stamp swipe-card__stamp--left" aria-hidden="true">
                  {leftLabel}
                </span>
              </div>
            )
          })
        )}
      </div>

      {!isFinished ? (
        <div className="swipe-deck__controls">
          <button
            type="button"
            className="swipe-deck__round swipe-deck__round--left"
            onClick={() => commit('left')}
            aria-label={leftLabel}
            title={`${leftLabel} (←)`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
          <button
            type="button"
            className="swipe-deck__round swipe-deck__round--flip"
            onClick={() => {
              setHasInteracted(true)
              setFlipped((value) => !value)
            }}
            aria-label="Lật thẻ"
            title="Lật thẻ (Space)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 12a8 8 0 0 1 13.7-5.6L20 9M20 4v5h-5M20 12a8 8 0 0 1-13.7 5.6L4 15M4 20v-5h5" />
            </svg>
          </button>
          <button
            type="button"
            className="swipe-deck__round swipe-deck__round--right"
            onClick={() => commit('right')}
            aria-label={rightLabel}
            title={`${rightLabel} (→)`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
          </button>
        </div>
      ) : null}

      {!isFinished ? (
        <p className="swipe-deck__legend">
          <span>← Vuốt trái: {leftLabel}</span>
          <span>Vuốt phải: {rightLabel} →</span>
        </p>
      ) : null}
    </div>
  )
}
