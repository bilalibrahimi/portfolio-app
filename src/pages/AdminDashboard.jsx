import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getGHConfig, setGHConfig, clearAdminSession } from '../lib/storage.js'
import { commitProjectData } from '../lib/github.js'

export default function AdminDashboard() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null) // project id being toggled
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showSetup, setShowSetup] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!getGHConfig()) setShowSetup(true)
    loadProjects()
  }, [])

  function loadProjects() {
    const base = import.meta.env.BASE_URL ?? '/'
    fetch(`${base}projects.json?_=${Date.now()}`)
      .then(r => r.json())
      .then(data => {
        setProjects([...data].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  async function togglePublish(project) {
    setSaving(project.id)
    try {
      const updated = projects.map(p =>
        p.id === project.id
          ? { ...p, published: !p.published, updatedAt: new Date().toISOString() }
          : p
      )
      await commitProjectData(updated)
      setProjects(updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)))
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setSaving(null)
    }
  }

  async function deleteProject(project) {
    setSaving(project.id)
    try {
      const updated = projects.filter(p => p.id !== project.id)
      await commitProjectData(updated)
      setProjects(updated)
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setSaving(null)
      setDeleteTarget(null)
    }
  }

  function signOut() {
    clearAdminSession()
    navigate('/admin')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/" style={{ color: 'var(--muted)', fontSize: 13 }}>← Portfolio</Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <h1 className="page-title">Projects</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSetup(true)}>
            Settings
          </button>
          <button className="btn btn-ghost btn-sm" onClick={signOut}>
            Sign out
          </button>
          <Link to="/admin/new" className="btn btn-primary btn-sm">
            + New project
          </Link>
        </div>
      </div>

      {/* Projects table */}
      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
          <p style={{ marginBottom: 20 }}>No projects yet.</p>
          <Link to="/admin/new" className="btn btn-primary">Create your first project</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {projects.map(project => (
            <div
              key={project.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 16px',
                background: 'var(--surface)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
              }}
            >
              {/* Thumbnail */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 6,
                overflow: 'hidden',
                background: 'var(--border)',
                flexShrink: 0,
              }}>
                {project.images?.[0] && (
                  <img
                    src={(() => {
                      const base = import.meta.env.BASE_URL ?? '/'
                      const p = project.images[0]
                      if (p.startsWith('http')) return p
                      return base.replace(/\/$/, '') + '/' + p.replace(/^\//, '')
                    })()}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {project.title}
                  </span>
                  <span className={`tag ${project.published ? 'badge-published' : 'badge-draft'}`}>
                    {project.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 12 }}>
                  {project.tags?.length > 0 && <span>{project.tags.join(', ')}</span>}
                  <span>{project.images?.length ?? 0} image{project.images?.length !== 1 ? 's' : ''}</span>
                  <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => togglePublish(project)}
                  disabled={saving === project.id}
                >
                  {saving === project.id ? (
                    <div className="spinner" style={{ width: 14, height: 14 }} />
                  ) : project.published ? 'Unpublish' : 'Publish'}
                </button>
                <Link to={`/admin/edit/${project.id}`} className="btn btn-ghost btn-sm">
                  Edit
                </Link>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setDeleteTarget(project)}
                  disabled={saving === project.id}
                  style={{ color: 'var(--danger)', borderColor: 'transparent' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Delete project?</h2>
            <p className="modal-subtitle">
              "{deleteTarget.title}" will be permanently removed. This cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={() => deleteProject(deleteTarget)}
                disabled={saving === deleteTarget.id}
              >
                {saving === deleteTarget.id ? <div className="spinner" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GitHub setup modal */}
      {showSetup && <GHSetupModal onClose={() => setShowSetup(false)} />}
    </div>
  )
}

function GHSetupModal({ onClose }) {
  const existing = getGHConfig() ?? {}
  const [token, setToken] = useState(existing.token ?? '')
  const [owner, setOwner] = useState(existing.owner ?? '')
  const [repo, setRepo] = useState(existing.repo ?? '')

  function save(e) {
    e.preventDefault()
    if (!token || !owner || !repo) return
    setGHConfig({ token: token.trim(), owner: owner.trim(), repo: repo.trim() })
    onClose()
  }

  return (
    <div className="modal-backdrop">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">GitHub Setup</h2>
        <p className="modal-subtitle">
          Required once so the admin can commit changes to your repo and trigger a redeploy.
        </p>
        <form onSubmit={save}>
          <div className="form-group">
            <label className="form-label">Personal Access Token</label>
            <input
              type="password"
              placeholder="github_pat_..."
              value={token}
              onChange={e => setToken(e.target.value)}
              required
            />
            <p className="form-hint">Needs <code>contents: write</code> permission on your repo.</p>
          </div>
          <div className="form-group">
            <label className="form-label">Repository owner</label>
            <input
              placeholder="your-github-username"
              value={owner}
              onChange={e => setOwner(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Repository name</label>
            <input
              placeholder="PortfolioApp"
              value={repo}
              onChange={e => setRepo(e.target.value)}
              required
            />
          </div>
          <div className="modal-actions">
            {getGHConfig() && (
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            )}
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}
