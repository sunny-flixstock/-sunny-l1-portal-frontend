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

export function fetchClientAngles(params = {}) {
  return apiRequest(`/client-angle${buildQueryString(params)}`)
}

export function fetchClientAngle(id, params = {}) {
  return apiRequest(
    `/client-angle/${encodeURIComponent(id)}${buildQueryString(params)}`,
  )
}

export function fetchClientAngleVersions(seriesKey) {
  return apiRequest(
    `/client-angle/series/${encodeURIComponent(seriesKey)}/versions`,
  )
}

export function fetchClientAnglesMeta() {
  return apiRequest('/client-angle/meta')
}

export function presignClientAngleUploads(body) {
  return apiRequest('/client-angle/presign', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function generateClientAngle(body) {
  return apiRequest('/client-angle/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function reviseClientAngleDefinition(body) {
  return apiRequest('/client-angle', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function renameClientAngle(id, name) {
  return apiRequest(`/client-angle/${encodeURIComponent(id)}/name`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}

export function archiveClientAngle(id) {
  return apiRequest(`/client-angle/${encodeURIComponent(id)}/archive`, {
    method: 'POST',
  })
}
