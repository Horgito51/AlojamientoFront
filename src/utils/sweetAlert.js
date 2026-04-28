import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

const isDarkTheme = () => document.documentElement.classList.contains('dark')

const themeOptions = () => {
  const isDark = isDarkTheme()
  return {
    background: isDark ? '#0f172a' : '#ffffff',
    color: isDark ? '#f8fafc' : '#0f172a',
    confirmButtonColor: '#4f46e5',
    cancelButtonColor: isDark ? '#334155' : '#64748b',
    customClass: {
      popup: 'app-swal-popup',
      title: 'app-swal-title',
      htmlContainer: 'app-swal-text',
      confirmButton: 'app-swal-button',
      cancelButton: 'app-swal-button',
    },
  }
}

export const showSuccess = (title, text) =>
  Swal.fire({
    ...themeOptions(),
    icon: 'success',
    title,
    text,
    timer: 1800,
    timerProgressBar: true,
  })

export const showError = (title, text) =>
  Swal.fire({
    ...themeOptions(),
    icon: 'error',
    title,
    text,
  })

export const confirmDelete = (text = 'Esta accion no se puede deshacer.') =>
  Swal.fire({
    ...themeOptions(),
    icon: 'warning',
    title: 'Eliminar registro',
    text,
    showCancelButton: true,
    confirmButtonText: 'Si, eliminar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    focusCancel: true,
  })
