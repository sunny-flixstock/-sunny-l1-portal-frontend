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

export function fetchBaseAngles(params = {}) {
  return apiRequest(`/base-angle${buildQueryString(params)}`)
}

export function fetchBaseAngle(id, params = {}) {
  return apiRequest(
    `/base-angle/${encodeURIComponent(id)}${buildQueryString(params)}`,
  )
}

export function fetchBaseAngleVersions(seriesKey) {
  return apiRequest(
    `/base-angle/series/${encodeURIComponent(seriesKey)}/versions`,
  )
}

export function fetchBaseAnglesMeta() {
  return apiRequest('/base-angle/meta')
}

export function presignBaseAngleUploads(body) {
  return apiRequest('/base-angle/presign', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function createBaseAngle(body) {
  return apiRequest('/base-angle', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function renameBaseAngle(id, name) {
  return apiRequest(`/base-angle/${encodeURIComponent(id)}/name`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}

export function archiveBaseAngle(id) {
  return apiRequest(`/base-angle/${encodeURIComponent(id)}/archive`, {
    method: 'POST',
  })
}
