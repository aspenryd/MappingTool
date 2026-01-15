import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useMsal } from '@azure/msal-react'
import { loginRequest } from './authConfig'

// Helper to decode JWT and extract role
function parseJwtRole(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    // Role claim can be in different formats
    return payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
      || payload.role
      || 'User'
  } catch {
    return 'User'
  }
}

interface AuthContextType {
  isAuthenticated: boolean
  token: string | null
  user: string | null
  role: string
  isAdmin: boolean
  isLoading: boolean
  login: (asAdmin?: boolean) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: null,
  user: null,
  role: 'User',
  isAdmin: false,
  isLoading: true,
  login: () => { },
  logout: () => { },
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
  const [role, setRole] = useState<string>('User')
  const [isLoading, setIsLoading] = useState(true)

  const isAdmin = role === 'Admin'

  const loginDev = useCallback(async (asAdmin: boolean = false) => {
    try {
      const roleParam = asAdmin ? 'Admin' : 'User'
      const response = await fetch(`/api/auth/login?role=${roleParam}`, {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        sessionStorage.setItem('dev_token', data.token)
        sessionStorage.setItem('dev_role', data.role || roleParam)
        setToken(data.token)
        setUser(data.user || (asAdmin ? 'Dev Admin' : 'Dev User'))
        setRole(data.role || roleParam)
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
      const storedToken = sessionStorage.getItem('dev_token')
      const storedRole = sessionStorage.getItem('dev_role')
      if (storedToken) {
        const parsedRole = storedRole || parseJwtRole(storedToken)
        setToken(storedToken)
        setUser(parsedRole === 'Admin' ? 'Dev Admin' : 'Dev User')
        setRole(parsedRole)
        setIsAuthenticated(true)
        setIsLoading(false)
      } else {
        // Don't auto-login in dev mode - show login screen
        setIsLoading(false)
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
            setRole(parseJwtRole(response.accessToken))
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
  }, [isDev, accounts, instance])

  const login = useCallback((asAdmin: boolean = false) => {
    if (isDev) {
      loginDev(asAdmin)
    } else {
      instance.loginRedirect(loginRequest)
    }
  }, [isDev, instance, loginDev])

  const logout = useCallback(() => {
    if (isDev) {
      sessionStorage.removeItem('dev_token')
      sessionStorage.removeItem('dev_role')
      setToken(null)
      setUser(null)
      setRole('User')
      setIsAuthenticated(false)
    } else {
      instance.logoutRedirect()
    }
  }, [isDev, instance])

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, token, user, role, isAdmin, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
