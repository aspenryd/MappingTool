import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './auth/AuthProvider'
import { apiClient } from './api/client'
import { NavBar } from './components/layout'
import { ToastContainer, Button } from './components/ui'
import { SystemList, SystemDetail } from './pages/systems'
import { ProjectList, ProjectDetail } from './pages/projects'
import { MappingCanvas } from './pages/mapping'
import { AdminDashboard, BatchSystemsUpload, BatchDataObjectsUpload, BatchProjectsUpload, UserManagement } from './pages/admin'

function App() {
  const { isAuthenticated, isLoading, login, token, isAdmin } = useAuth()
  const [loginAsAdmin, setLoginAsAdmin] = useState(false)

  useEffect(() => {
    apiClient.setTokenGetter(() => token)
  }, [token])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-xl text-white">
              IM
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              Integration Mapper
            </h1>
          </div>
          <p className="text-slate-600 max-w-md">
            Design and manage integration mappings between your systems with a
            visual editor.
          </p>

          {/* Role Toggle - only in dev mode */}
          {import.meta.env.DEV && (
            <div className="flex justify-center">
              <div className="inline-flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                <button
                  onClick={() => setLoginAsAdmin(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${!loginAsAdmin
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  User
                </button>
                <button
                  onClick={() => setLoginAsAdmin(true)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${loginAsAdmin
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Admin
                </button>
              </div>
            </div>
          )}

          <Button onClick={() => login(loginAsAdmin)} size="lg">
            Login {loginAsAdmin ? 'as Admin' : 'to Continue'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <NavBar />
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/systems" element={<SystemList />} />
          <Route path="/systems/:id" element={<SystemDetail />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/mapping/:id" element={<MappingCanvas />} />

          {/* Admin routes - only accessible when isAdmin */}
          {isAdmin && (
            <>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/systems" element={<BatchSystemsUpload />} />
              <Route path="/admin/dataobjects" element={<BatchDataObjectsUpload />} />
              <Route path="/admin/projects" element={<BatchProjectsUpload />} />
              <Route path="/admin/users" element={<UserManagement />} />
            </>
          )}

          {/* Redirect non-admins trying to access admin routes */}
          {!isAdmin && (
            <Route path="/admin/*" element={<Navigate to="/projects" replace />} />
          )}
        </Routes>
      </main>
      <ToastContainer />
    </div>
  )
}

export default App
