import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

const isDarkTheme = () => document.documentElement.classList.contains('dark')

export const themeOptions = () => {
  const isDark = isDarkTheme()
  return {
    background: isDark ? '#0f172a' : '#ffffff',
    color: isDark ? '#f8fafc' : '#1e293b',
    confirmButtonColor: '#4f46e5',
    cancelButtonColor: isDark ? '#334155' : '#94a3b8',
    customClass: {
      popup: 'app-swal-popup rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl',
      title: 'app-swal-title text-2xl font-bold tracking-tight',
      htmlContainer: 'app-swal-text text-base leading-relaxed text-slate-600 dark:text-slate-400',
      confirmButton: 'app-swal-button px-8 py-3 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20',
      cancelButton: 'app-swal-button px-8 py-3 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95',
    },
    showClass: {
      popup: 'animate__animated animate__fadeInUp animate__faster'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutDown animate__faster'
    },
    heightAuto: false,
    backdrop: `rgba(15, 23, 42, ${isDark ? '0.8' : '0.4'}) blur(8px)`,
    buttonsStyling: false,
  }
}

/**
 * Parsea los errores del backend para mostrarlos de forma amigable.
 */
export const getErrorMessage = (error) => {
  if (error?.isClientInternalAccessBlocked) {
    return 'El flujo publico intento acceder a un endpoint administrativo. Recarga la pagina e intenta nuevamente.'
  }

  const data = error?.response?.data
  if (!data) return sanitizeErrorMessage(error?.message || 'Ocurrio un error inesperado. Por favor, intenta de nuevo.')

  if (data.errors) {
    const errorMessages = Object.entries(data.errors)
      .map(([field, messages]) => {
        const list = Array.isArray(messages) ? messages : [messages]
        return `${field}: ${list.filter(Boolean).join(', ')}`
      })
      .filter(Boolean)
      .join('<br />')
    return sanitizeErrorMessage(errorMessages)
  }

  if (typeof data.error === 'object' && data.error !== null) {
    const message = data.error.message || data.error.mensaje || data.error.detail || data.error.title || 'No se pudo procesar la solicitud.'
    return appendTraceId(sanitizeErrorMessage(message), data, error)
  }

  const rawMessage = data.message || data.mensaje || data.error || data.detail || data.title || (typeof data === 'string' ? data : 'No se pudo procesar la solicitud.');
  return appendTraceId(sanitizeErrorMessage(rawMessage), data, error)
}

export const sanitizeErrorMessage = (message) => {
  if (typeof message !== 'string') return message;
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('tabla') || lowerMsg.includes('sql') || lowerMsg.includes('database') || lowerMsg.includes('foreign key') || lowerMsg.includes('.dbo.')) {
    return 'Ocurrió un error interno en el servidor al procesar los datos. Por favor, contacta a soporte si el problema persiste.';
  }
  return message;
}

const appendTraceId = (message, data, error) => {
  const traceId = data?.traceId || data?.TraceId || error?.response?.headers?.['x-trace-id']
  if (!traceId) return message
  return `${message}<br /><span class="text-xs opacity-80">Codigo de seguimiento: ${traceId}</span>`
}

export const showSuccess = (title, text) =>
  Swal.fire({
    ...themeOptions(),
    icon: 'success',
    iconColor: '#10b981',
    title,
    html: text,
    timer: 3000,
    timerProgressBar: true,
  })

export const showError = (title, text) =>
  Swal.fire({
    ...themeOptions(),
    icon: 'error',
    iconColor: '#ef4444',
    title,
    html: typeof text === 'string' ? text : getErrorMessage(text),
  })

export const showInfo = (title, text, options = {}) =>
  Swal.fire({
    ...themeOptions(),
    icon: 'info',
    iconColor: '#4f46e5',
    title,
    html: text,
    ...options,
  })

export const showLoading = (title = 'Procesando...', text = 'Por favor espera un momento.') =>
  Swal.fire({
    ...themeOptions(),
    title,
    html: text,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading()
    }
  })

export const confirmDelete = (text = 'Esta acción no se puede deshacer.') =>
  Swal.fire({
    ...themeOptions(),
    icon: 'warning',
    iconColor: '#f59e0b',
    title: '¿Estás seguro?',
    text,
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    focusCancel: true,
  })
