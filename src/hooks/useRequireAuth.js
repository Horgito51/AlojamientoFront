import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import Swal from 'sweetalert2'

export const useRequireAuth = (message = 'Debes iniciar sesión para hacer reservas') => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  return {
    requireAuth: () => {
      if (!isAuthenticated()) {
        Swal.fire({
          title: 'Inicia sesión',
          text: message,
          icon: 'info',
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
