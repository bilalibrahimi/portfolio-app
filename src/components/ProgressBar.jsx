import { useEffect, useRef } from 'react'

// duration: ms for a full bar fill
// state: 'active' | 'done' | 'pending'
export default function ProgressBar({ state, duration, onComplete }) {
  const barRef = useRef(null)
  const startRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    if (state !== 'active') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (barRef.current) {
        barRef.current.style.transition = 'none'
        barRef.current.style.width = state === 'done' ? '100%' : '0%'
      }
      return
    }

    startRef.current = performance.now()

    function tick(now) {
      const elapsed = now - startRef.current
      const pct = Math.min((elapsed / duration) * 100, 100)
      if (barRef.current) barRef.current.style.width = `${pct}%`
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        onComplete?.()
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [state, duration]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      flex: 1,
      height: 3,
      background: 'rgba(255,255,255,0.25)',
      borderRadius: 2,
      overflow: 'hidden',
    }}>
      <div
        ref={barRef}
        style={{
          height: '100%',
          width: '0%',
          background: '#fff',
          borderRadius: 2,
        }}
      />
    </div>
  )
}
