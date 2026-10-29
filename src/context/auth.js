import { createContext, useContext } from 'react'

export const AUTH_KEY = 'personal-cosmos:auth'

export const AuthContext = createContext(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
