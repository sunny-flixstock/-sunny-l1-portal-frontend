import { apiRequest } from './http.js'

function buildQueryString({ q, pageNum, pageSize }) {
  const params = new URLSearchParams()

  if (q) {
    params.set('q', q)
  }

  if (pageNum) {
    params.set('pageNum', String(pageNum))
  }

  if (pageSize) {
    params.set('pageSize', String(pageSize))
  }

  const query = params.toString()
  return query ? `?${query}` : ''
}

export function fetchClients({ q, pageNum, pageSize } = {}) {
  return apiRequest(`/client${buildQueryString({ q, pageNum, pageSize })}`)
}

export function fetchAllClients({ q } = {}) {
  const params = new URLSearchParams()
  if (q) {
    params.set('q', q)
  }
  const query = params.toString()
  return apiRequest(`/client/all${query ? `?${query}` : ''}`)
}

export function fetchClient(code) {
  return apiRequest(`/client/${encodeURIComponent(code)}`)
}

export function createClient(body) {
  return apiRequest('/client', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateClientCsvConfig(code, csvConfig) {
  return apiRequest(`/client/${encodeURIComponent(code)}/csvConfig`, {
    method: 'PATCH',
    body: JSON.stringify({ csvConfig }),
  })
}
