import { apiRequest } from './http.js'

export function loginWithPassword(password) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
}
