const ADMIN_SESSION_KEY = 'portfolio_admin_session'
const GH_CONFIG_KEY = 'portfolio_gh_config'

// ── Admin session (sessionStorage — clears on tab close) ──

export function setAdminSession() {
  sessionStorage.setItem(ADMIN_SESSION_KEY, '1')
}

export function hasAdminSession() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1'
}

export function clearAdminSession() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY)
}

// ── GitHub config (localStorage — persists) ───────────────

export function getGHConfig() {
  try {
    const raw = localStorage.getItem(GH_CONFIG_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setGHConfig(config) {
  localStorage.setItem(GH_CONFIG_KEY, JSON.stringify(config))
}

export function clearGHConfig() {
  localStorage.removeItem(GH_CONFIG_KEY)
}
