import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { hasAdminSession } from './lib/storage.js'
import Portfolio from './pages/Portfolio.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import ProjectEditor from './pages/ProjectEditor.jsx'

function RequireAuth({ children }) {
  const location = useLocation()
  if (!hasAdminSession()) {
    return <Navigate to="/admin" state={{ from: location }} replace />
  }
  return children
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Portfolio />} />

        {/* Admin login */}
        <Route path="/admin" element={<AdminLogin />} />

        {/* Protected admin routes */}
        <Route
          path="/admin/dashboard"
          element={<RequireAuth><AdminDashboard /></RequireAuth>}
        />
        <Route
          path="/admin/new"
          element={<RequireAuth><ProjectEditor /></RequireAuth>}
        />
        <Route
          path="/admin/edit/:id"
          element={<RequireAuth><ProjectEditor /></RequireAuth>}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
