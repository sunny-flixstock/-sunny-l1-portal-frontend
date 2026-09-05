import { apiRequest } from './http.js'

// Ground truth documents/versions
export function fetchL1GroundTruthDocuments(params = {}) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value)
  }
  const query = search.toString()
  return apiRequest(`/l1-feedback/ground-truth${query ? `?${query}` : ''}`)
}

export function fetchL1GroundTruthVersions(documentId) {
  return apiRequest(`/l1-feedback/ground-truth/${encodeURIComponent(documentId)}/versions`)
}

export function fetchL1GroundTruthVersionContent(versionId) {
  return apiRequest(`/l1-feedback/ground-truth/versions/${encodeURIComponent(versionId)}`)
}

export function promoteL1GroundTruthVersion(documentId, versionId) {
  return apiRequest(`/l1-feedback/ground-truth/${encodeURIComponent(documentId)}/promote`, {
    method: 'POST',
    body: JSON.stringify({ versionId }),
  })
}

export function seedL1GroundTruthDocuments() {
  return apiRequest('/l1-feedback/ground-truth/seed', { method: 'POST' })
}

export function resetL1GroundTruthToCleanBaseline() {
  return apiRequest('/l1-feedback/ground-truth/reset', {
    method: 'POST',
    body: JSON.stringify({ confirm: true }),
  })
}

// Batches (upload + processing)
export function createL1FeedbackBatch(configs) {
  return apiRequest('/l1-feedback/batches', {
    method: 'POST',
    body: JSON.stringify({ configs }),
  })
}

export function fetchL1FeedbackBatches() {
  return apiRequest('/l1-feedback/batches')
}

export function fetchL1FeedbackBatch(id) {
  return apiRequest(`/l1-feedback/batches/${encodeURIComponent(id)}`)
}

export function fetchL1FeedbackBatchDetail(id) {
  return apiRequest(`/l1-feedback/batches/${encodeURIComponent(id)}/detail`)
}

// HITL issues
export function fetchL1FeedbackIssues(params = {}) {
  const search = new URLSearchParams()
  if (params.skuIds?.length) search.set('skuIds', params.skuIds.join(','))
  const query = search.toString()
  return apiRequest(`/l1-feedback/issues${query ? `?${query}` : ''}`)
}

export function submitL1FeedbackIssueDecision(body) {
  return apiRequest('/l1-feedback/issues/decision', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
