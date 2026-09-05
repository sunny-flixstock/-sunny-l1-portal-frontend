import { createContext } from 'react'
import { getIsLoggedIn } from '../utils/auth.js'

export const initialState = {
  isLoggedIn: getIsLoggedIn(),
}

export function appReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, isLoggedIn: true }
    case 'LOGOUT':
      return { ...state, isLoggedIn: false }
    default:
      return state
  }
}

export const AppContext = createContext(null)
