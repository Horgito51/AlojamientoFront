import axios from 'axios'

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'https://alojamientojj-dabge3g4eufvd8a2.mexicocentral-01.azurewebsites.net',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Interceptor para adjuntar el token en cada request
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('alojamiento-auth')
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
      localStorage.removeItem('alojamiento-auth')
    }
    return Promise.reject(error)
  },
)

export default api
