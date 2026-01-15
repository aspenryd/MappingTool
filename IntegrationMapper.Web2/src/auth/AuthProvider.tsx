import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useMsal } from '@azure/msal-react'
import { loginRequest } from './authConfig'

interface AuthContextType {
  isAuthenticated: boolean
  token: string | null
  user: string | null
  isLoading: boolean
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: null,
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
})

export const useAuth = () => useContext(AuthContext)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const isDev = import.meta.env.DEV
  const { instance, accounts } = useMsal()

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loginDev = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        sessionStorage.setItem('dev_token', data.token)
        setToken(data.token)
        setUser('Dev User')
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error('Dev Login failed', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isDev) {
      const stored = sessionStorage.getItem('dev_token')
      if (stored) {
        setToken(stored)
        setUser('Dev User')
        setIsAuthenticated(true)
        setIsLoading(false)
      } else {
        loginDev()
      }
    } else {
      if (accounts.length > 0) {
        instance
          .acquireTokenSilent({
            ...loginRequest,
            account: accounts[0],
          })
          .then((response) => {
            setToken(response.accessToken)
            setUser(accounts[0].username)
            setIsAuthenticated(true)
          })
          .catch((e) => {
            console.error(e)
          })
          .finally(() => {
            setIsLoading(false)
          })
      } else {
        setIsLoading(false)
      }
    }
  }, [isDev, accounts, instance, loginDev])

  const login = useCallback(() => {
    if (isDev) {
      loginDev()
    } else {
      instance.loginRedirect(loginRequest)
    }
  }, [isDev, instance, loginDev])

  const logout = useCallback(() => {
    if (isDev) {
      sessionStorage.removeItem('dev_token')
      setToken(null)
      setUser(null)
      setIsAuthenticated(false)
    } else {
      instance.logoutRedirect()
    }
  }, [isDev, instance])

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, token, user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
