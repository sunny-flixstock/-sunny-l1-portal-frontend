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

export function fetchFrameworkVersions(params = {}) {
  return apiRequest(`/framework-version${buildQueryString(params)}`)
}

export function fetchFrameworkVersion(id) {
  return apiRequest(`/framework-version/${encodeURIComponent(id)}`)
}

export function createFrameworkVersion(body) {
  return apiRequest('/framework-version', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function startFrameworkCreation(id) {
  return apiRequest(`/framework-version/${encodeURIComponent(id)}/start-creation`, {
    method: 'POST',
  })
}

export function fetchFrameworkVersionDomainDescriptions(id) {
  return apiRequest(`/framework-version/${encodeURIComponent(id)}/domain-descriptions`)
}

export function updateFrameworkVersionDomainDescription(id, domain, body) {
  return apiRequest(
    `/framework-version/${encodeURIComponent(id)}/domain-descriptions/${encodeURIComponent(domain)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  )
}

export function archiveFrameworkVersion(id) {
  return apiRequest(`/framework-version/${encodeURIComponent(id)}/archive`, {
    method: 'POST',
  })
}

export function makeFrameworkVersionLive(id) {
  return apiRequest(`/framework-version/${encodeURIComponent(id)}/make-live`, {
    method: 'POST',
  })
}

export function demoteToInReview(id) {
  return apiRequest(`/framework-version/${encodeURIComponent(id)}/demote-to-in-review`, {
    method: 'POST',
  })
}
