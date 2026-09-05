import { apiRequest } from './http.js'

export function getL1GenericFeedbackUploadUrl(fileName) {
  return apiRequest(`/l1-feedback/generic/getUploadUrl?fileName=${encodeURIComponent(fileName)}`)
}

export function submitL1GenericFeedback(body) {
  return apiRequest('/l1-feedback/generic', {
    method: 'POST',
    body: JSON.stringify(body),
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
