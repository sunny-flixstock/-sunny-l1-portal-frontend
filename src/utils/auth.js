const TOKEN_KEY = 'sessionToken'

export function getSessionToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getIsLoggedIn() {
  return Boolean(getSessionToken())
}

export function setLoggedIn(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearLoggedIn() {
  localStorage.removeItem(TOKEN_KEY)
}
