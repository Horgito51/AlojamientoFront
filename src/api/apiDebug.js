import api, { API_BASE_URL } from './api/axiosConfig'
import { ENDPOINTS } from './api/endpoints'

/**
 * 🔍 Herramienta de Debug para verificar conectividad con la API
 * 
 * Úsalo en la consola del navegador:
 * 
 * import { apiDebug } from './apiDebug'
 * 
 * Luego:
 * apiDebug.testConnection()        // Prueba conexión básica
 * apiDebug.testLogin(email, pass)  // Prueba login
 * apiDebug.testEndpoint(url)       // Prueba cualquier endpoint
 */

const apiDebug = {
  // Info
  info: () => {
    console.log('=== API Debug Info ===')
    console.log('Base URL:', API_BASE_URL)
    console.log('Auth Login Endpoint:', ENDPOINTS.AUTH.login)
    console.log('Full URL:', `${API_BASE_URL}/${ENDPOINTS.AUTH.login}`)
    return { API_BASE_URL, endpoint: ENDPOINTS.AUTH.login }
  },

  // Test conexión básica
  testConnection: async () => {
    console.log('🔗 Probando conexión a la API...')
    try {
      const response = await api.get('/')
      console.log('✅ Conexión exitosa!')
      console.log('Response:', response)
      return response
    } catch (err) {
      console.error('❌ Error de conexión:', err.message)
      console.error('Detalles:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        code: err.code,
        message: err.message,
      })
      return err
    }
  },

  // Test login
  testLogin: async (username, password) => {
    console.log('🔐 Probando login con:', username)
    try {
      const response = await api.post(ENDPOINTS.AUTH.login, {
        username,
        password,
      })
      console.log('✅ Login exitoso!')
      console.log('Response:', response.data)
      return response.data
    } catch (err) {
      console.error('❌ Error en login:', err.message)
      console.error('Detalles completos:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        code: err.code,
        message: err.message,
        url: err.config?.url,
      })
      return err
    }
  },

  // Test endpoint genérico
  testEndpoint: async (endpoint, method = 'GET', data = null) => {
    console.log(`🧪 Probando ${method} ${endpoint}`)
    try {
      let response
      if (method === 'GET') {
        response = await api.get(endpoint)
      } else if (method === 'POST') {
        response = await api.post(endpoint, data)
      }
      console.log(`✅ ${method} exitoso!`)
      console.log('Response:', response.data)
      return response.data
    } catch (err) {
      console.error(`❌ Error en ${method}:`, err.message)
      console.error('Detalles:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        code: err.code,
      })
      return err
    }
  },

  // Verificar CORS
  testCors: async () => {
    console.log('🔍 Verificando CORS...')
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      })
      console.log('✅ CORS preflight:', response.status)
      console.log('Headers:', Object.fromEntries(response.headers))
      return response
    } catch (err) {
      console.error('❌ Error CORS:', err.message)
      return err
    }
  },
}

export default apiDebug
