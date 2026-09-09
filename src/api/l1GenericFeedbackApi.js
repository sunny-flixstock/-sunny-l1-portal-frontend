import { apiRequest } from './http.js'

export function submitL1GenericFeedback(body) {
  return apiRequest('/l1-feedback/generic', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function submitL1GenericFeedbackZip({ text, bundleFile, createdBy }) {
  const formData = new FormData()
  formData.append('text', text)
  formData.append('bundle', bundleFile)
  if (createdBy) formData.append('createdBy', createdBy)
  return apiRequest('/l1-feedback/generic/zip', {
    method: 'POST',
    body: formData,
  })
}

export function fetchL1GenericFeedbackList() {
  return apiRequest('/l1-feedback/generic')
}

export function fetchL1GenericFeedback(id) {
  return apiRequest(`/l1-feedback/generic/${encodeURIComponent(id)}`)
}

export function submitL1GenericFeedbackDecision(id, body) {
  return apiRequest(`/l1-feedback/generic/${encodeURIComponent(id)}/decision`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function deleteL1GenericFeedback(id) {
  return apiRequest(`/l1-feedback/generic/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
