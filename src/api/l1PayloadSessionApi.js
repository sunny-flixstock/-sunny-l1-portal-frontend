import { apiRequest } from './http.js'
import { getSessionToken } from '../utils/auth.js'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7015/api/v1'

export function createL1PayloadSession({ files, feedbackDoc, date, createdBy }) {
  const formData = new FormData()
  files.forEach((file) => formData.append('documents', file))
  formData.append('feedbackDoc', feedbackDoc)
  if (date) formData.append('date', date)
  if (createdBy) formData.append('createdBy', createdBy)
  return apiRequest('/l1-feedback/payload-sessions', {
    method: 'POST',
    body: formData,
  })
}

export function fetchL1PayloadSessions() {
  return apiRequest('/l1-feedback/payload-sessions')
}

export function fetchL1PayloadSession(id) {
  return apiRequest(`/l1-feedback/payload-sessions/${encodeURIComponent(id)}`)
}

export function fetchL1PayloadFeedbackItems(id) {
  return apiRequest(`/l1-feedback/payload-sessions/${encodeURIComponent(id)}/feedback-items`)
}

export function verifyL1PayloadFeedbackItem(id, { skuId, itemIndex, status }) {
  return apiRequest(`/l1-feedback/payload-sessions/${encodeURIComponent(id)}/feedback-items/verify`, {
    method: 'POST',
    body: JSON.stringify({ skuId, itemIndex, status }),
  })
}

export function fetchL1PayloadSessionFiles(id) {
  return apiRequest(`/l1-feedback/payload-sessions/${encodeURIComponent(id)}/files`)
}

export function fetchL1PayloadSessionFilesWithContent(id) {
  return apiRequest(`/l1-feedback/payload-sessions/${encodeURIComponent(id)}/files/content`)
}

// Binary response -- apiRequest always parses JSON, so this bypasses it the
// same way FormData uploads bypass its forced Content-Type, per http.js.
export async function downloadL1PayloadSessionZip(id) {
  const token = getSessionToken()
  const response = await fetch(`${API_BASE}/l1-feedback/payload-sessions/${encodeURIComponent(id)}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) {
    throw new Error('Failed to download payload session zip')
  }
  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  const filename = match?.[1] || `input_payload_${id}.zip`

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
