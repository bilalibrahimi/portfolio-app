import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ProjectCard from '../components/ProjectCard.jsx'
import StoriesViewer from '../components/StoriesViewer.jsx'

export default function Portfolio() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(null)
  const [activeTag, setActiveTag] = useState(null)

  useEffect(() => {
    const base = import.meta.env.BASE_URL ?? '/'
    fetch(`${base}projects.json`)
      .then(r => r.json())
      .then(data => {
        setProjects(data.filter(p => p.published))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const allTags = [...new Set(projects.flatMap(p => p.tags ?? []))]

  const filtered = activeTag
    ? projects.filter(p => p.tags?.includes(activeTag))
    : projects

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        padding: '32px 24px 0',
        maxWidth: 1100,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Portfolio</h1>
        <Link
          to="/admin"
          style={{ fontSize: 13, color: 'var(--muted)', transition: 'color 0.15s' }}
          onMouseEnter={e => e.target.style.color = 'var(--text)'}
          onMouseLeave={e => e.target.style.color = 'var(--muted)'}
        >
          Admin
        </Link>
      </header>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div style={{
          padding: '24px 24px 0',
          maxWidth: 1100,
          margin: '0 auto',
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}>
          <button
            className={`tag${!activeTag ? ' badge-published' : ''}`}
            onClick={() => setActiveTag(null)}
            style={{ cursor: 'pointer' }}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              className={`tag${activeTag === tag ? ' badge-published' : ''}`}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              style={{ cursor: 'pointer' }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <main style={{
        padding: '32px 24px 60px',
        maxWidth: 1100,
        margin: '0 auto',
      }}>
        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            paddingTop: 80,
            color: 'var(--muted)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>◆</div>
            <p>No projects yet.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16,
          }}>
            {filtered.map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => setActiveIndex(i)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Stories viewer */}
      {activeIndex !== null && (
        <StoriesViewer
          projects={filtered}
          initialIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </div>
  )
}
