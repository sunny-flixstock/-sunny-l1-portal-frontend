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

export function advanceL1GroundTruthStagingVersion(documentId) {
  return apiRequest(`/l1-feedback/ground-truth/${encodeURIComponent(documentId)}/advance-staging`, {
    method: 'POST',
  })
}

export function advanceL1GroundTruthStagingVersionBulk(documentIds) {
  return apiRequest('/l1-feedback/ground-truth/advance-staging-bulk', {
    method: 'POST',
    body: JSON.stringify(documentIds ? { documentIds } : {}),
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

// One-click BZT Sports auto-run: fetches the window's reworked SKUs from
// Phoenix, builds a Payload Creation session, emails the deck, and hands it
// to the same batch pipeline createL1FeedbackBatch above uses.
export function runBztSportsAutoBatch({ windowHours, startTime, endTime } = {}) {
  return apiRequest('/l1-feedback/auto-run', {
    method: 'POST',
    body: JSON.stringify({ windowHours, startTime, endTime }),
  })
}

// HITL issues
export function fetchL1FeedbackIssues(params = {}) {
  const search = new URLSearchParams()
  if (params.skuIds?.length) search.set('skuIds', params.skuIds.join(','))
  // Default (omitted): server hides any SKU-level issue already absorbed
  // into a pending batch-level cluster, so the list is issue-wise.
  if (params.includeClustered) search.set('includeClustered', 'true')
  const query = search.toString()
  return apiRequest(`/l1-feedback/issues${query ? `?${query}` : ''}`)
}

export function submitL1FeedbackIssueDecision(body) {
  return apiRequest('/l1-feedback/issues/decision', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
