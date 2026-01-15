import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'

export function NavBar() {
  const { user, logout } = useAuth()

  return (
    <header className="h-14 bg-slate-900 text-white flex items-center px-6 shadow-lg">
      <div className="flex items-center gap-8 flex-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-sm">
            IM
          </div>
          <span className="font-semibold tracking-wide">
            INTEGRATION <span className="text-blue-400">MAPPER</span>
          </span>
        </div>

        <nav className="flex gap-1">
          <NavLink
            to="/systems"
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`
            }
          >
            Systems
          </NavLink>
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`
            }
          >
            Projects
          </NavLink>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-400">{user}</span>
        <button
          onClick={logout}
          className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
