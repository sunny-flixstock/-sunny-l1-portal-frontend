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

export function fetchAngleTechnicalSpecifications(params = {}) {
  return apiRequest(`/angle-technical-specification${buildQueryString(params)}`)
}

export function fetchAngleTechnicalSpecification(id) {
  return apiRequest(`/angle-technical-specification/${encodeURIComponent(id)}`)
}

export function fetchAngleTechnicalSpecificationsMeta() {
  return apiRequest('/angle-technical-specification/meta')
}

export function createAngleTechnicalSpecification(body) {
  return apiRequest('/angle-technical-specification', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function deleteAngleTechnicalSpecification(id) {
  return apiRequest(`/angle-technical-specification/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
