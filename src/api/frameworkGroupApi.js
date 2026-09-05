import { apiRequest } from './http.js'

function buildQueryString(params) {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  }

  const query = search.toString()
  return query ? `?${query}` : ''
}

export function fetchFrameworkGroups(params = {}) {
  return apiRequest(`/framework-group${buildQueryString(params)}`)
}

export function fetchFrameworkGroup(id) {
  return apiRequest(`/framework-group/${encodeURIComponent(id)}`)
}

export function createFrameworkGroup(body) {
  return apiRequest('/framework-group', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateFrameworkGroup(id, body) {
  return apiRequest(`/framework-group/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function deleteFrameworkGroup(id) {
  return apiRequest(`/framework-group/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
