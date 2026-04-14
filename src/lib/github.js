import { getGHConfig } from './storage.js'

function base() {
  const { owner, repo } = getGHConfig()
  return `https://api.github.com/repos/${owner}/${repo}/contents`
}

function headers() {
  const { token } = getGHConfig()
  return {
    Authorization: `token ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github+json',
  }
}

// ── Fetch a file's content + SHA ─────────────────────────

export async function getFile(path) {
  const res = await fetch(`${base()}/${path}`, { headers: headers() })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return { sha: data.sha, content: atob(data.content.replace(/\n/g, '')) }
}

// ── Create or update a file ───────────────────────────────

export async function putFile(path, textContent, sha, message) {
  const encoded = btoa(unescape(encodeURIComponent(textContent)))
  const body = { message: message || `chore: update ${path}`, content: encoded }
  if (sha) body.sha = sha

  const res = await fetch(`${base()}/${path}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${await res.text()}`)
  return await res.json()
}

// ── Upload a binary file (image) from a File object ───────

export async function uploadImage(projectId, file) {
  const base64 = await fileToBase64(file)
  // Strip the data URI prefix
  const content = base64.split(',')[1]
  const path = `public/images/${projectId}/${file.name}`

  // Check if file already exists (to get SHA for update)
  const existing = await getFile(path)
  const sha = existing?.sha ?? undefined

  const body = {
    message: `feat: upload image for project ${projectId}`,
    content,
  }
  if (sha) body.sha = sha

  const res = await fetch(`${base()}/${path}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${await res.text()}`)
  return path
}

// ── Delete a file ─────────────────────────────────────────

export async function deleteFile(path) {
  const existing = await getFile(path)
  if (!existing) return // already gone

  const body = {
    message: `chore: remove ${path}`,
    sha: existing.sha,
  }

  const res = await fetch(`${base()}/${path}`, {
    method: 'DELETE',
    headers: headers(),
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${await res.text()}`)
}

// ── Commit the full projects array ────────────────────────

export async function commitProjectData(projects) {
  const path = 'public/projects.json'
  const existing = await getFile(path)
  const text = JSON.stringify(projects, null, 2) + '\n'
  await putFile(path, text, existing?.sha, 'chore: update projects data')
}

// ── Helpers ───────────────────────────────────────────────

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
