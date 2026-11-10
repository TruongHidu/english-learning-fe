import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

interface HorizontalSwipeOptions {
  enabled?: boolean
  /** Minimum horizontal travel in px before a gesture counts as a swipe. */
  threshold?: number
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}

const IGNORE_SELECTOR =
  'input, textarea, select, [contenteditable="true"], [data-swipe-ignore], [role="dialog"], [role="menu"]'

/** True when the touch started inside something that scrolls sideways on its own. */
function isInsideHorizontalScroller(target: Element, boundary: Element): boolean {
  let node: Element | null = target
  while (node && node !== boundary) {
    if (node.scrollWidth > node.clientWidth + 2) {
      const overflowX = window.getComputedStyle(node).overflowX
      if (overflowX === 'auto' || overflowX === 'scroll') return true
    }
    node = node.parentElement
  }
  return false
}

/**
 * Detects quick horizontal swipes on touch screens. Uses touch events (not
 * pointer events) because the browser cancels pointer streams as soon as it
 * starts a vertical scroll, while touchend always fires.
 */
export function useHorizontalSwipe<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { enabled = true, threshold = 70, onSwipeLeft, onSwipeRight }: HorizontalSwipeOptions,
) {
  const handlers = useRef({ onSwipeLeft, onSwipeRight })

  useEffect(() => {
    handlers.current = { onSwipeLeft, onSwipeRight }
  }, [onSwipeLeft, onSwipeRight])

  useEffect(() => {
    const element = ref.current
    if (!element || !enabled) return

    let start: { x: number; y: number; time: number } | null = null

    function handleStart(event: TouchEvent) {
      if (event.touches.length !== 1) {
        start = null
        return
      }
      const touch = event.touches[0]
      const target = event.target instanceof Element ? event.target : null
      // Leave the screen edges to the OS back/forward gestures.
      const nearEdge = touch.clientX < 24 || touch.clientX > window.innerWidth - 24
      if (!target || nearEdge || target.closest(IGNORE_SELECTOR) || isInsideHorizontalScroller(target, element!)) {
        start = null
        return
      }
      start = { x: touch.clientX, y: touch.clientY, time: Date.now() }
    }

    function handleEnd(event: TouchEvent) {
      if (!start) return
      const touch = event.changedTouches[0]
      const dx = touch.clientX - start.x
      const dy = touch.clientY - start.y
      const elapsed = Date.now() - start.time
      start = null

      if (elapsed > 700 || Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 2) return
      if (window.getSelection()?.toString()) return

      if (dx < 0) handlers.current.onSwipeLeft?.()
      else handlers.current.onSwipeRight?.()
    }

    function handleCancel() {
      start = null
    }

    element.addEventListener('touchstart', handleStart, { passive: true })
    element.addEventListener('touchend', handleEnd, { passive: true })
    element.addEventListener('touchcancel', handleCancel, { passive: true })
    return () => {
      element.removeEventListener('touchstart', handleStart)
      element.removeEventListener('touchend', handleEnd)
      element.removeEventListener('touchcancel', handleCancel)
    }
  }, [ref, enabled, threshold])
}
