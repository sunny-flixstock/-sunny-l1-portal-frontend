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

export function fetchAnglePresets(params = {}) {
  return apiRequest(`/angle-preset${buildQueryString(params)}`)
}

export function fetchAnglePreset(id) {
  return apiRequest(`/angle-preset/${encodeURIComponent(id)}`)
}

export function createAnglePreset(body) {
  return apiRequest('/angle-preset', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateAnglePreset(id, body) {
  return apiRequest(`/angle-preset/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deleteAnglePreset(id) {
  return apiRequest(`/angle-preset/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
