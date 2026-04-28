import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ allowedRoles = [] }) {
  const location = useLocation()
  const { isAuthenticated, hasRole } = useAuth()

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allowedRoles.length > 0) {
    const hasAnyAllowedRole = allowedRoles.some(role => hasRole(role))
    if (!hasAnyAllowedRole) {
      // Si no tiene el rol, redirigir a inicio o una página de acceso denegado
      return <Navigate to="/" replace />
    }
  }

  return <Outlet />
}
