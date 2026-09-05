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

export function fetchFrameworkVocabs(params = {}) {
  return apiRequest(`/framework-vocab${buildQueryString(params)}`)
}

export function fetchFrameworkVocab(id) {
  return apiRequest(`/framework-vocab/${encodeURIComponent(id)}`)
}

export function createFrameworkVocab(body) {
  return apiRequest('/framework-vocab', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function deleteFrameworkVocab(id) {
  return apiRequest(`/framework-vocab/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
