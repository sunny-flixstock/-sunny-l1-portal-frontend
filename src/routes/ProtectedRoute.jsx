import { Navigate, Outlet } from 'react-router-dom'
import { useAppContext } from '../context/useAppContext.js'

export function ProtectedRoute() {
  const { state } = useAppContext()

  if (!state.isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
