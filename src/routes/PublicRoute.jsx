import { Navigate, Outlet } from 'react-router-dom'
import { useAppContext } from '../context/useAppContext.js'

export function PublicRoute() {
  const { state } = useAppContext()

  if (state.isLoggedIn) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
