import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setAdminSession } from '../lib/storage.js'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    const correct = import.meta.env.VITE_ADMIN_PASSWORD
    if (!correct) {
      // No password set — allow access in dev mode
      setAdminSession()
      navigate('/admin/dashboard')
      return
    }
    if (password === correct) {
      setAdminSession()
      navigate('/admin/dashboard')
    } else {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 360,
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>
          Admin
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32 }}>
          Enter your password to continue.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false) }}
              autoFocus
              style={error ? { borderColor: 'var(--danger)' } : {}}
            />
            {error && (
              <p style={{ color: 'var(--danger)', fontSize: 13 }}>Incorrect password.</p>
            )}
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}
