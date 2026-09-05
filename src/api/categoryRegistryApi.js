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

export function fetchCategoryRegistries(params = {}) {
  return apiRequest(`/category-registry${buildQueryString(params)}`)
}

export function fetchCategoryRegistry(id) {
  return apiRequest(`/category-registry/${encodeURIComponent(id)}`)
}

export function createCategoryRegistry(body) {
  return apiRequest('/category-registry', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function deleteCategoryRegistry(id) {
  return apiRequest(`/category-registry/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
