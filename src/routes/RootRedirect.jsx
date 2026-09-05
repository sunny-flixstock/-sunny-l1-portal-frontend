import { Navigate } from 'react-router-dom'
import { useAppContext } from '../context/useAppContext.js'

export function RootRedirect() {
  const { state } = useAppContext()

  return <Navigate to={state.isLoggedIn ? '/dashboard' : '/login'} replace />
}
