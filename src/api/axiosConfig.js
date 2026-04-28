import axios from 'axios'
import { LOCAL_STORAGE_AUTH_KEY } from '../utils/auth'

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  'https://alojamientojj-dabge3g4eufvd8a2.mexicocentral-01.azurewebsites.net'
).replace(/\/+$/, '')

const isAuthEndpoint = (url = '') => url.includes('/auth/')

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Interceptor para adjuntar el token en cada request
api.interceptors.request.use((config) => {
  if (isAuthEndpoint(config.url)) return config

  const stored = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY)
  if (stored) {
    try {
      const { token } = JSON.parse(stored)
      if (token) config.headers.Authorization = `Bearer ${token}`
    } catch {
      // token malformado, ignorar
    }
  }
  return config
})

// Interceptor de respuesta para manejar 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY)
    }
    return Promise.reject(error)
  },
)

export { API_BASE_URL }
export default api
