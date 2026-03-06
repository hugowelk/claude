import { useRef, useCallback } from 'react'

/**
 * Returns touch event handlers that call onSwipeLeft / onSwipeRight
 * when the user swipes more than `threshold` pixels horizontally.
 */
export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 50 } = {}) {
  const startX = useRef(null)
  const startY = useRef(null)

  const onTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
  }, [])

  const onTouchEnd = useCallback((e) => {
    if (startX.current === null) return
    const dx = e.changedTouches[0].clientX - startX.current
    const dy = e.changedTouches[0].clientY - startY.current

    // Only trigger if horizontal movement dominates (avoids vertical scroll)
    if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.5) return

    if (dx < 0) onSwipeLeft?.()
    else onSwipeRight?.()

    startX.current = null
    startY.current = null
  }, [onSwipeLeft, onSwipeRight, threshold])

  return { onTouchStart, onTouchEnd }
}
