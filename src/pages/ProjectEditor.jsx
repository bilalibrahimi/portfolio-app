import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { commitProjectData, uploadImage, deleteFile } from '../lib/github.js'

export default function ProjectEditor() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()

  const [allProjects, setAllProjects] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // 'success' | 'error' | null

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [link, setLink] = useState('')
  const [published, setPublished] = useState(false)
  const [images, setImages] = useState([]) // { path: string, file?: File, preview?: string, toDelete?: bool }

  const fileInputRef = useRef(null)

  useEffect(() => {
    const base = import.meta.env.BASE_URL ?? '/'
    fetch(`${base}projects.json?_=${Date.now()}`)
      .then(r => r.json())
      .then(data => {
        setAllProjects(data)
        if (!isNew) {
          const project = data.find(p => p.id === id)
          if (project) {
            setTitle(project.title)
            setDescription(project.description ?? '')
            setTagsInput(project.tags?.join(', ') ?? '')
            setLink(project.link ?? '')
            setPublished(project.published)
            setImages(project.images?.map(path => ({ path })) ?? [])
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id, isNew])

  function handleFiles(e) {
    const files = Array.from(e.target.files)
    const newImages = files.map(file => ({
      path: null,
      file,
      preview: URL.createObjectURL(file),
    }))
    setImages(prev => [...prev, ...newImages])
    e.target.value = ''
  }

  function removeImage(index) {
    setImages(prev => prev.map((img, i) =>
      i === index ? { ...img, toDelete: true } : img
    ))
  }

  function moveImage(index, direction) {
    setImages(prev => {
      const arr = [...prev]
      const target = index + direction
      if (target < 0 || target >= arr.length) return arr;
      [arr[index], arr[target]] = [arr[target], arr[index]]
      return arr
    })
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!title.trim()) return

    setSaving(true)
    setSaveStatus(null)

    try {
      const projectId = isNew ? nanoid(8) : id
      const now = new Date().toISOString()

      // Upload new images
      const finalImages = []
      for (const img of images) {
        if (img.toDelete) {
          // Delete from repo if it has a committed path
          if (img.path) {
            try { await deleteFile(img.path) } catch { /* ok if already gone */ }
          }
          continue
        }
        if (img.file) {
          const path = await uploadImage(projectId, img.file)
          finalImages.push(path)
        } else if (img.path) {
          finalImages.push(img.path)
        }
      }

      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      const updatedProject = {
        id: projectId,
        title: title.trim(),
        description: description.trim() || null,
        tags,
        link: link.trim() || null,
        images: finalImages,
        published,
        createdAt: isNew ? now : (allProjects.find(p => p.id === id)?.createdAt ?? now),
        updatedAt: now,
      }

      let updatedProjects
      if (isNew) {
        updatedProjects = [...allProjects, updatedProject]
      } else {
        updatedProjects = allProjects.map(p => p.id === id ? updatedProject : p)
      }

      await commitProjectData(updatedProjects)
      setSaveStatus('success')
      setTimeout(() => navigate('/admin/dashboard'), 1200)
    } catch (err) {
      console.error(err)
      setSaveStatus('error')
      alert(`Save failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const base = import.meta.env.BASE_URL ?? '/'
  function imageUrl(path) {
    if (!path) return ''
    if (path.startsWith('http') || path.startsWith('blob:')) return path
    return base.replace(/\/$/, '') + '/' + path.replace(/^\//, '')
  }

  const visibleImages = images.filter(img => !img.toDelete)

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/admin/dashboard" style={{ color: 'var(--muted)', fontSize: 13 }}>← Back</Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <h1 className="page-title">{isNew ? 'New project' : 'Edit project'}</h1>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="My awesome project"
            required
            autoFocus={isNew}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="A short description..."
            rows={3}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Tags</label>
          <input
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            placeholder="web, mobile, design"
          />
          <p className="form-hint">Comma-separated</p>
        </div>

        <div className="form-group">
          <label className="form-label">External link</label>
          <input
            type="url"
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="https://example.com"
          />
        </div>

        {/* Images */}
        <div className="form-group" style={{ marginBottom: 28 }}>
          <label className="form-label">Images</label>

          {visibleImages.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 10,
              marginBottom: 12,
            }}>
              {visibleImages.map((img, visibleIdx) => {
                const realIdx = images.indexOf(img)
                return (
                  <div key={realIdx} style={{ position: 'relative' }}>
                    <img
                      src={img.preview ? img.preview : imageUrl(img.path)}
                      alt=""
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                      }}
                    />
                    {/* Order badge */}
                    <div style={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      borderRadius: 4,
                      fontSize: 11,
                      padding: '2px 5px',
                    }}>
                      {visibleIdx + 1}
                    </div>
                    {/* Controls */}
                    <div style={{
                      position: 'absolute',
                      bottom: 6,
                      left: 6,
                      right: 6,
                      display: 'flex',
                      gap: 4,
                    }}>
                      {visibleIdx > 0 && (
                        <button
                          type="button"
                          onClick={() => moveImage(realIdx, -1)}
                          style={{
                            flex: 1, background: 'rgba(0,0,0,0.6)', color: '#fff',
                            borderRadius: 4, fontSize: 12, padding: '3px 0', border: 'none', cursor: 'pointer',
                          }}
                        >←</button>
                      )}
                      {visibleIdx < visibleImages.length - 1 && (
                        <button
                          type="button"
                          onClick={() => moveImage(realIdx, 1)}
                          style={{
                            flex: 1, background: 'rgba(0,0,0,0.6)', color: '#fff',
                            borderRadius: 4, fontSize: 12, padding: '3px 0', border: 'none', cursor: 'pointer',
                          }}
                        >→</button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(realIdx)}
                        style={{
                          flex: 1, background: 'rgba(200,50,50,0.8)', color: '#fff',
                          borderRadius: 4, fontSize: 12, padding: '3px 0', border: 'none', cursor: 'pointer',
                        }}
                      >✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => fileInputRef.current?.click()}
          >
            + Add images
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            style={{ display: 'none' }}
          />
        </div>

        {/* Publish toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          marginBottom: 24,
        }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>
              {published ? 'Published' : 'Draft'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {published ? 'Visible to visitors' : 'Only visible in admin'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPublished(p => !p)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              background: published ? 'var(--success)' : 'var(--border)',
              position: 'relative',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute',
              top: 3,
              left: published ? 23 : 3,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.2s',
            }} />
          </button>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || !title.trim()}
          >
            {saving ? <><div className="spinner" /> Saving…</> : 'Save project'}
          </button>
          <Link to="/admin/dashboard" className="btn btn-ghost">Cancel</Link>
          {saveStatus === 'success' && (
            <span style={{ color: 'var(--success)', fontSize: 13 }}>✓ Saved — redirecting…</span>
          )}
        </div>
      </form>
    </div>
  )
}
