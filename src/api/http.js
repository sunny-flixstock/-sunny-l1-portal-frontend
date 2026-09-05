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

export async function apiRequest(path, options = {}) {
  const { headers, ...rest } = options
  const token = getSessionToken()

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

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
