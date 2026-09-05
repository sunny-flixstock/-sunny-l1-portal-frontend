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

export function fetchInputSets(params = {}) {
  return apiRequest(`/input-set${buildQueryString(params)}`)
}

export function fetchInputSet(id) {
  return apiRequest(`/input-set/${encodeURIComponent(id)}`)
}

export function createInputSet(body) {
  return apiRequest('/input-set', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateInputSet(id, body) {
  return apiRequest(`/input-set/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function archiveInputSet(id) {
  return apiRequest(`/input-set/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
