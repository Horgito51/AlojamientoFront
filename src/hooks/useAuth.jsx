import { useState, useContext, createContext, useCallback } from 'react'

const AuthContext = createContext(null)

export const LOCAL_STORAGE_AUTH_KEY = 'alojamiento-auth'

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY)
    return stored ? JSON.parse(stored) : null
  })

  const login = useCallback((authData) => {
    setAuth(authData)
    localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(authData))
  }, [])

  const logout = useCallback(() => {
    setAuth(null)
    localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY)
  }, [])

  const isAuthenticated = useCallback(() => {
    return auth?.token ? true : false
  }, [auth])

  const getUserRoles = useCallback(() => {
    if (!auth?.roles) return []
    // Manejar tanto array simple como objeto con $values de .NET
    const roles = Array.isArray(auth.roles) ? auth.roles : auth.roles?.$values || []
    return roles.map(r => String(r.nombreRol || r).toUpperCase())
  }, [auth])

  const hasRole = useCallback((roleName) => {
    const roles = getUserRoles()
    const search = String(roleName).toUpperCase()
    return roles.includes(search)
  }, [getUserRoles])

  return (
    <AuthContext.Provider value={{ auth, login, logout, isAuthenticated, hasRole, getUserRoles }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  return context
}
