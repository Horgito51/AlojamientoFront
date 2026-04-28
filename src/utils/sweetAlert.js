import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

const isDarkTheme = () => document.documentElement.classList.contains('dark')

const themeOptions = () => {
  const isDark = isDarkTheme()
  return {
    background: isDark ? '#1e293b' : '#ffffff',
    color: isDark ? '#f8fafc' : '#0f172a',
    confirmButtonColor: '#4f46e5',
    cancelButtonColor: isDark ? '#334155' : '#64748b',
    customClass: {
      popup: 'app-swal-popup rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl',
      title: 'app-swal-title text-xl font-bold',
      htmlContainer: 'app-swal-text text-sm leading-relaxed',
      confirmButton: 'app-swal-button px-6 py-2.5 rounded-lg font-semibold transition-all hover:scale-105 active:scale-95',
      cancelButton: 'app-swal-button px-6 py-2.5 rounded-lg font-semibold transition-all hover:scale-105 active:scale-95',
    },
    // Auto-detect theme if possible, though manual override is more reliable with Tailwind dark class
    heightAuto: false,
    backdrop: `rgba(0,0,0,0.4) blur(4px)`
  }
}

/**
 * Parsea los errores del backend para mostrarlos de forma amigable.
 * El backend suele devolver { errors: { field: ["msg1", "msg2"] } } o { message: "msg" }
 */
export const getErrorMessage = (error) => {
  const data = error.response?.data
  if (!data) return 'Ocurrió un error inesperado. Por favor, intenta de nuevo.'

  if (data.errors) {
    const errorList = Object.entries(data.errors)
      .map(([field, messages]) => `<li class="text-left mb-1"><strong>${field}:</strong> ${messages.join(', ')}</li>`)
      .join('')
    return `<ul class="mt-2 list-disc pl-5">${errorList}</ul>`
  }

  return data.message || data.error || 'No se pudo procesar la solicitud.'
}

export const showSuccess = (title, text) =>
  Swal.fire({
    ...themeOptions(),
    icon: 'success',
    title,
    html: text,
    timer: 2500,
    timerProgressBar: true,
  })

export const showError = (title, text) =>
  Swal.fire({
    ...themeOptions(),
    icon: 'error',
    title,
    html: typeof text === 'string' ? text : getErrorMessage(text),
  })

export const showLoading = (title = 'Procesando...', text = 'Por favor espera un momento.') =>
  Swal.fire({
    ...themeOptions(),
    title,
    text,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading()
    }
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
