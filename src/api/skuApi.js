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

export function fetchSkuStatsByClient() {
  return apiRequest('/sku/statsByClient')
}

export function fetchSkus(params = {}) {
  return apiRequest(`/sku${buildQueryString(params)}`)
}

export function fetchSkuById(id) {
  return apiRequest(`/sku/${encodeURIComponent(id)}`)
}

export function updateSkuShouldNotProduce({ barcode, clientName, shouldNotProduce }) {
  return apiRequest('/sku/doNotProduce', {
    method: 'POST',
    body: JSON.stringify({ barcode, clientName, shouldNotProduce }),
  })
}
