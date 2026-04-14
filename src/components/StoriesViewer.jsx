import { useState, useEffect, useCallback, useRef } from 'react'
import ProgressBar from './ProgressBar.jsx'

const SLIDE_DURATION = 5000 // ms per image

export default function StoriesViewer({ projects, initialIndex = 0, onClose }) {
  const [projectIndex, setProjectIndex] = useState(initialIndex)
  const [imageIndex, setImageIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef(null)

  const project = projects[projectIndex]
  const images = project?.images ?? []
  const total = images.length

  const goNextImage = useCallback(() => {
    if (imageIndex < total - 1) {
      setImageIndex(i => i + 1)
    } else if (projectIndex < projects.length - 1) {
      setProjectIndex(p => p + 1)
      setImageIndex(0)
    } else {
      onClose()
    }
  }, [imageIndex, total, projectIndex, projects.length, onClose])

  const goPrevImage = useCallback(() => {
    if (imageIndex > 0) {
      setImageIndex(i => i - 1)
    } else if (projectIndex > 0) {
      setProjectIndex(p => p - 1)
      setImageIndex(0)
    } else {
      onClose()
    }
  }, [imageIndex, projectIndex, onClose])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNextImage()
      if (e.key === 'ArrowLeft') goPrevImage()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNextImage, goPrevImage, onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function handleClick(e) {
    const x = e.clientX
    const w = e.currentTarget.offsetWidth
    if (x / w < 0.35) {
      goPrevImage()
    } else {
      goNextImage()
    }
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (delta < -40) goNextImage()
    else if (delta > 40) goPrevImage()
  }

  // Build base URL that accounts for Vite's base path
  const base = import.meta.env.BASE_URL ?? '/'

  function imageUrl(path) {
    if (!path) return ''
    if (path.startsWith('http')) return path
    return base.replace(/\/$/, '') + '/' + path.replace(/^\//, '')
  }

  if (!project) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
      }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Progress bars */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        gap: 4,
        padding: '12px 12px 0',
        zIndex: 10,
      }}>
        {images.map((_, i) => (
          <ProgressBar
            key={i}
            duration={paused ? Infinity : SLIDE_DURATION}
            state={i < imageIndex ? 'done' : i === imageIndex ? 'active' : 'pending'}
            onComplete={i === imageIndex ? goNextImage : undefined}
          />
        ))}
      </div>

      {/* Close button */}
      <button
        onClick={e => { e.stopPropagation(); onClose() }}
        style={{
          position: 'absolute',
          top: 28,
          right: 16,
          zIndex: 20,
          color: '#fff',
          fontSize: 28,
          lineHeight: 1,
          padding: 4,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textShadow: '0 1px 4px rgba(0,0,0,0.5)',
        }}
        aria-label="Close"
      >
        ×
      </button>

      {/* Image */}
      <img
        key={`${projectIndex}-${imageIndex}`}
        src={imageUrl(images[imageIndex])}
        alt={project.title}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
        draggable={false}
      />

      {/* Bottom overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '60px 24px 32px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      >
        <div style={{ pointerEvents: 'auto' }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
            {project.title}
          </h2>
          {project.description && (
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 12, lineHeight: 1.5 }}>
              {project.description}
            </p>
          )}
          {project.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {project.tags.map(tag => (
                <span key={tag} style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 500,
                  background: 'rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.8)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                display: 'inline-block',
                padding: '9px 20px',
                background: '#fff',
                color: '#000',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Visit project →
            </a>
          )}
        </div>
      </div>

      {/* Left / right tap zones (visual hint on desktop) */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: '35%',
        cursor: 'w-resize',
      }} />
      <div style={{
        position: 'absolute',
        right: 0, top: 0, bottom: 0,
        width: '65%',
        cursor: 'e-resize',
      }} />
    </div>
  )
}
