import { apiRequest } from './http.js'

export function fetchApiDocs() {
  return apiRequest('/api-docs')
}

export function fetchApiDoc(name) {
  return apiRequest(`/api-docs/${encodeURIComponent(name)}`)
}
