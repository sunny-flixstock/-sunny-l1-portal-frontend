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

export function fetchExampleImages(params = {}) {
  return apiRequest(`/example-image${buildQueryString(params)}`)
}

export function fetchExampleImageTags(client) {
  return apiRequest(`/example-image/tags${buildQueryString({ client })}`)
}

export function fetchExampleImage(id) {
  return apiRequest(`/example-image/${encodeURIComponent(id)}`)
}

export async function fetchExampleImagesByIds(ids) {
  const results = await Promise.all(ids.map((id) => fetchExampleImage(id)))
  return results.map((response) => response.data)
}

export function presignExampleImageUploads(body) {
  return apiRequest('/example-image/presign', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function createExampleImage(body) {
  return apiRequest('/example-image', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateExampleImage(id, body) {
  return apiRequest(`/example-image/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function batchUpdateExampleImages(updates) {
  return apiRequest('/example-image/batch-update', {
    method: 'POST',
    body: JSON.stringify({ updates }),
  })
}

export function fetchThumbnailStatus(ids) {
  return apiRequest('/example-image/thumbnail-status', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
}

export function deleteExampleImage(id) {
  return apiRequest(`/example-image/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
