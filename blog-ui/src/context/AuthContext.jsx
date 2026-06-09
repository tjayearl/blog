/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const token = localStorage.getItem('token')

    const loadUser = async () => {
      if (!token) {
        if (active) setLoading(false)
        return
      }

      try {
        const response = await api.get('/auth/me')
        if (active) setUser(response.data)
      } catch {
        localStorage.removeItem('token')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadUser()
    return () => {
      active = false
    }
  }, [])

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password })
    localStorage.setItem('token', response.data.access_token)
    setUser(response.data.user)
    return response.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}