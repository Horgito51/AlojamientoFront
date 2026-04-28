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

  return (
    <AuthContext.Provider value={{ auth, login, logout, isAuthenticated }}>
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
