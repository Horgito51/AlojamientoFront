import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../api/axiosConfig'
import { ENDPOINTS } from '../api/endpoints'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../hooks/useAuth'

const getAuthPayload = (data) => data?.data ?? data?.result ?? data

const pickFirstText = (...values) =>
  values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() ?? ''

// ── Toggle sol / luna ──────────────────────────────────────────────────────────
function ThemeToggle() {
  const { isDark, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className={[
        'relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500',
        isDark ? 'bg-indigo-600' : 'bg-gray-200',
      ].join(' ')}
    >
      {/* Thumb */}
      <span
        className={[
          'absolute flex h-5 w-5 items-center justify-center rounded-full shadow-md transition-all duration-300',
          isDark
            ? 'translate-x-8 bg-white'
            : 'translate-x-1 bg-white',
        ].join(' ')}
      >
        {isDark ? (
          // Luna
          <svg className="h-3 w-3 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        ) : (
          // Sol
          <svg className="h-3 w-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        )}
      </span>
    </button>
  )
}

// ── Login principal ────────────────────────────────────────────────────────────
export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, login, hasRole } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) {
      const isAdmin = hasRole('ADMINISTRADOR') || hasRole('ADMIN') || hasRole('OPERATIVO') || hasRole('DESK_SERVICE')
      const destination = location.state?.from || (isAdmin ? '/admin' : '/habitaciones')
      navigate(destination, { replace: true })
    }
  }, [isAuthenticated, hasRole, location.state, navigate])

  const validate = () => {
    const next = {}
    if (!email.trim()) next.email = 'El correo es obligatorio.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = 'Ingresa un correo válido.'
    if (!password) next.password = 'La contraseña es obligatoria.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const username = email.trim()
      console.log('[Login] Intentando login con:', username)
      
      const { data } = await api.post(ENDPOINTS.AUTH.login, {
        username,
        password,
      })

      const auth = getAuthPayload(data)
      const token = pickFirstText(auth?.token, auth?.accessToken, auth?.access_token, auth?.jwt)

      if (!token) {
        throw new Error('AUTH_TOKEN_MISSING')
      }

      const authPayload = {
        email: auth?.email ?? auth?.correo ?? username,
        username: auth?.username ?? auth?.nombreUsuario ?? username,
        nombreCompleto: auth?.nombreCompleto ?? [auth?.nombres, auth?.apellidos].filter(Boolean).join(' '),
        token,
        refreshToken: auth?.refreshToken ?? auth?.refresh_token ?? '',
        roles: auth?.roles ?? [],
        user: {
          idCliente: auth?.idCliente
        }
      }

      const isAdmin = authPayload.roles.some(r => {
        const name = String(r.nombreRol || r).toUpperCase()
        return ['ADMINISTRADOR', 'ADMIN', 'OPERATIVO', 'DESK_SERVICE'].includes(name)
      })

      login(authPayload)
      onLoginSuccess?.(auth)
      
      const destination = location.state?.from || (isAdmin ? '/admin' : '/habitaciones')
      navigate(destination, { replace: true })
    } catch (err) {
      console.error('[Login Error Full]:', err)
      
      let msg = 'No se pudo iniciar sesión en este momento. Intenta de nuevo.'
      
      if (err.response?.status === 401) {
        msg = 'Correo o contraseña incorrectos. Verifica tus datos.'
      } else if (err.code === 'ECONNABORTED') {
        msg = 'La solicitud tardó demasiado. Verifica tu conexión.'
      } else if (err.code === 'ERR_NETWORK') {
        msg = 'No se puede conectar a la API. Verifica la URL del servidor.'
      } else if (err.response?.status === 0 || err.message === 'Network Error') {
        msg = 'Error de red. Verifica la conexión a internet.'
      } else if (err.response?.data?.message) {
        msg = err.response.data.message
      }
      
      setServerError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const fieldClass = (hasError) =>
    [
      'w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200',
      // light
      'bg-white text-gray-900 placeholder:text-gray-400',
      // dark
      'dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500',
      'focus:ring-2 focus:ring-offset-0',
      hasError
        ? 'border-red-400 focus:border-red-400 focus:ring-red-100 dark:border-red-500 dark:focus:ring-red-900/40'
        : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-100 dark:border-gray-700 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40',
    ].join(' ')

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex items-center justify-center p-4">

      {/* Toggle flotante arriba a la derecha */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 select-none">
          {/* Texto dinámico via CSS */}
        </span>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 dark:bg-indigo-500 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 mb-4 transition-colors duration-300">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
            Alojamiento JJ
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">
            Panel de administración
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-gray-100/80 dark:shadow-black/40 border border-gray-100 dark:border-gray-800 p-8 transition-colors duration-300">

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300">
              Iniciar sesión
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-300">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((p) => ({ ...p, email: '' }))
                  setServerError('')
                }}
                autoComplete="email"
                placeholder="correo@ejemplo.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-err' : undefined}
                className={fieldClass(!!errors.email)}
              />
              {errors.email && (
                <p id="email-err" className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-300">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors((p) => ({ ...p, password: '' }))
                    setServerError('')
                  }}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'pass-err' : undefined}
                  className={fieldClass(!!errors.password) + ' pr-11'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="pass-err" className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900/60 px-4 py-3 text-sm text-red-700 dark:text-red-400 transition-colors duration-300">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{serverError}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:active:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 px-4 transition-colors duration-200 shadow-sm shadow-indigo-200 dark:shadow-indigo-900/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              {isSubmitting && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>

            {/* Registro */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                  Regístrate aquí
                </Link>
              </p>
            </div>

          </form>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6 transition-colors duration-300">
          © {new Date().getFullYear()} Alojamiento JJ · Todos los derechos reservados
        </p>
        <p className="mt-3 text-center text-sm">
          <Link to="/" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Volver al sitio publico
          </Link>
        </p>
      </div>
    </div>
  )
}
