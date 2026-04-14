import { useState } from 'react'

export default function ProjectCard({ project, onClick }) {
  const [hovered, setHovered] = useState(false)

  const base = import.meta.env.BASE_URL ?? '/'

  function imageUrl(path) {
    if (!path) return ''
    if (path.startsWith('http')) return path
    return base.replace(/\/$/, '') + '/' + path.replace(/^\//, '')
  }

  const thumb = project.images?.[0]

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        cursor: 'pointer',
        aspectRatio: '3 / 4',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.6)' : '0 2px 12px rgba(0,0,0,0.3)',
      }}
    >
      {/* Thumbnail */}
      {thumb ? (
        <img
          src={imageUrl(thumb)}
          alt={project.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
          }}
          draggable={false}
        />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted)',
          fontSize: 32,
        }}>
          ◆
        </div>
      )}

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 50%)',
        opacity: hovered ? 1 : 0.6,
        transition: 'opacity 0.2s ease',
      }} />

      {/* Content */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px',
      }}>
        <h3 style={{
          fontSize: 15,
          fontWeight: 600,
          color: '#fff',
          marginBottom: project.tags?.length ? 8 : 0,
          lineHeight: 1.3,
        }}>
          {project.title}
        </h3>
        {project.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {project.tags.slice(0, 3).map(tag => (
              <span key={tag} style={{
                padding: '2px 7px',
                borderRadius: 3,
                fontSize: 10,
                fontWeight: 500,
                background: 'rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.7)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Image count indicator */}
      {project.images?.length > 1 && (
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: 'rgba(0,0,0,0.5)',
          borderRadius: 20,
          padding: '3px 8px',
          fontSize: 11,
          color: 'rgba(255,255,255,0.8)',
        }}>
          {project.images.length} ▶
        </div>
      )}
    </div>
  )
}
