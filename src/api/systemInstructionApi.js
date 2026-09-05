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

export function fetchInstructionTypes() {
  return apiRequest('/system-instruction/types')
}

export function fetchSystemInstructionsMeta() {
  return apiRequest('/system-instruction/meta')
}

export function fetchSystemInstructions(params = {}) {
  return apiRequest(`/system-instruction${buildQueryString(params)}`)
}

export function fetchSystemInstruction(id, { includeContent = false } = {}) {
  const query = includeContent ? '?includeContent=true' : ''
  return apiRequest(`/system-instruction/${encodeURIComponent(id)}${query}`)
}

export function createSystemInstruction(body) {
  return apiRequest('/system-instruction', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateSystemInstructionName(id, name) {
  return apiRequest(`/system-instruction/${encodeURIComponent(id)}/name`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}

export function archiveSystemInstruction(id) {
  return apiRequest(`/system-instruction/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
