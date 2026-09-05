import { apiRequest } from './http.js'

export function loginWithGoogle(credential) {
  return apiRequest('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  })
}
