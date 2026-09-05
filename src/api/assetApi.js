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

export function getAssetUploadUrl({ fileName, clientName }) {
  return apiRequest(
    `/asset/getUploadUrl${buildQueryString({ fileName, clientName })}`
  )
}

export function presignInternalAssetUploadUrls(body) {
  return apiRequest('/asset/internalAssetUploadUrls', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function createAssetsWithProperties(body) {
  return apiRequest('/asset/createWithProperties', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
