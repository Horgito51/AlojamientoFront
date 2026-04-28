import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axiosConfig'
import { ENDPOINTS } from '../api/endpoints'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'

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
      <span
        className={[
          'absolute flex h-5 w-5 items-center justify-center rounded-full shadow-md transition-all duration-300',
          isDark ? 'translate-x-8 bg-white' : 'translate-x-1 bg-white',
        ].join(' ')}
      >
        {isDark ? (
          <svg className="h-3 w-3 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        ) : (
          <svg className="h-3 w-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
        )}
      </span>
    </button>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    correo: '',
    username: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const validate = () => {
    const next = {}

    if (!formData.nombres.trim()) next.nombres = 'El nombre es obligatorio.'
    else if (formData.nombres.trim().length < 2) next.nombres = 'El nombre debe tener al menos 2 caracteres.'

    if (!formData.correo.trim()) next.correo = 'El correo es obligatorio.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo.trim()))
      next.correo = 'El correo no es válido.'

    if (!formData.username.trim()) next.username = 'El usuario es obligatorio.'
    else if (formData.username.trim().length < 3) next.username = 'El usuario debe tener al menos 3 caracteres.'

    if (!formData.password) next.password = 'La contraseña es obligatoria.'
    else if (formData.password.length < 10) next.password = 'La contraseña debe tener al menos 10 caracteres.'

    if (!formData.confirmPassword) next.confirmPassword = 'Debe confirmar la contraseña.'
    else if (formData.password !== formData.confirmPassword) next.confirmPassword = 'Las contraseñas no coinciden.'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    if (!validate()) return

    setIsSubmitting(true)
    try {
      const { data } = await api.post(ENDPOINTS.AUTH.registerCliente, {
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
        correo: formData.correo.trim(),
        username: formData.username.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      })

      const authData = data?.data ?? data?.result ?? data

      if (!authData?.accessToken && !authData?.token) {
        throw new Error('No se recibió token de autenticación')
      }

      const token = authData?.accessToken ?? authData?.token
      const authPayload = {
        email: authData?.correo ?? formData.correo,
        username: authData?.username ?? formData.username,
        nombreCompleto: authData?.nombreCompleto ?? `${formData.nombres} ${formData.apellidos}`,
        token,
        refreshToken: authData?.refreshToken ?? '',
        roles: authData?.roles ?? [],
        user: {
          id: authData?.usuarioGuid,
          idCliente: authData?.idCliente,
        },
      }

      login(authPayload)
      navigate('/')
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        error.response?.data?.errorDetail?.mensaje ||
        error.message ||
        'Error en el registro'
      setServerError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md rounded-lg bg-white shadow-lg dark:bg-gray-800 p-8">
        <h1 className="text-center text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Crear Cuenta
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          Regístrate para hacer reservas
        </p>

        {serverError && (
          <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900 p-3 text-sm text-red-700 dark:text-red-200">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombres */}
          <div>
            <label htmlFor="nombres" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre *
            </label>
            <input
              id="nombres"
              name="nombres"
              type="text"
              value={formData.nombres}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`mt-1 w-full rounded-md border ${
                errors.nombres ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="Tu nombre"
            />
            {errors.nombres && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nombres}</p>}
          </div>

          {/* Apellidos */}
          <div>
            <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Apellidos
            </label>
            <input
              id="apellidos"
              name="apellidos"
              type="text"
              value={formData.apellidos}
              onChange={handleChange}
              disabled={isSubmitting}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Tus apellidos"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="correo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Correo *
            </label>
            <input
              id="correo"
              name="correo"
              type="email"
              value={formData.correo}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`mt-1 w-full rounded-md border ${
                errors.correo ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="tu@correo.com"
            />
            {errors.correo && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.correo}</p>}
          </div>

          {/* Usuario */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Usuario *
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`mt-1 w-full rounded-md border ${
                errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="tu_usuario"
            />
            {errors.username && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username}</p>}
          </div>

          {/* Contraseña */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Contraseña *
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full rounded-md border ${
                  errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } px-3 py-2 pr-10 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                placeholder="Mínimo 10 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
          </div>

          {/* Confirmar Contraseña */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirmar Contraseña *
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`mt-1 w-full rounded-md border ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="Confirma tu contraseña"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-indigo-600 py-2 px-4 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
