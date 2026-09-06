import { getSessionToken, clearLoggedIn } from '../utils/auth.js'

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:7015/api/v1"

function getErrorMessage(data) {
  if (typeof data.message === 'string') {
    return data.message
  }

  if (data.message?.body?.length) {
    return data.message.body.join(', ')
  }

  if (data.message?.query?.length) {
    return data.message.query.join(', ')
  }

  return 'Request failed'
}

// A slow/dropped connection uploading a large image payload (e.g. several
// folder-picked photos, base64-inflated ~33%) must never leave the caller
// hanging on a spinner forever with no feedback -- abort and surface a
// clear, actionable error instead.
const REQUEST_TIMEOUT_MS = 90000

export async function apiRequest(path, options = {}) {
  const { headers, ...rest } = options
  const token = getSessionToken()
  // FormData bodies (e.g. a ZIP upload) need the browser to set its own
  // multipart boundary in Content-Type -- forcing application/json here
  // would break the request.
  const isFormData = typeof FormData !== 'undefined' && rest.body instanceof FormData

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(
        `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s — the upload may be too large or the connection too slow. Try fewer/smaller images.`,
        { cause: err }
      )
    }
    throw new Error(`Network error — could not reach the server: ${err.message}`, { cause: err })
  } finally {
    clearTimeout(timeoutId)
  }

  const data = await response.json().catch(() => ({}))

  if (response.status === 401) {
    // Session missing/expired -- clear it and bounce to login rather than
    // surfacing a confusing error from whatever screen triggered this call.
    clearLoggedIn()
    window.location.href = '/login'
    throw new Error('Session expired — please log in again')
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data))
  }

  return data
}
