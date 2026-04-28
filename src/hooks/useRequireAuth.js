import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import { showInfo } from '../utils/sweetAlert'

export const useRequireAuth = (message = 'Debes iniciar sesion para hacer reservas') => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  return {
    requireAuth: () => {
      if (!isAuthenticated()) {
        showInfo('Inicia sesion', message, {
          confirmButtonText: 'Ir a Login',
          allowOutsideClick: false,
        }).then(() => {
          navigate('/login', { state: { from: location.pathname } })
        })
        return false
      }
      return true
    },
  }
}
