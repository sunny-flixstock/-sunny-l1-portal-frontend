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

export function fetchRules(params = {}) {
  return apiRequest(`/rule${buildQueryString(params)}`)
}

export function fetchRule(id) {
  return apiRequest(`/rule/${encodeURIComponent(id)}`)
}

export function fetchRulesMeta() {
  return apiRequest('/rule/meta')
}

export function fetchRuleTags(client) {
  return apiRequest(`/rule/tags${buildQueryString({ client })}`)
}

export function createRule(body) {
  return apiRequest('/rule', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function createRulesBulk(rules) {
  return apiRequest('/rule/bulk', {
    method: 'POST',
    body: JSON.stringify({ rules }),
  })
}

export function updateRule(id, body) {
  return apiRequest(`/rule/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function deleteRule(id) {
  return apiRequest(`/rule/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
