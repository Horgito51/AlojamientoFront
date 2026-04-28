import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { adminNavigation } from '../data/adminModules'
import { useAuth } from '../hooks/useAuth'

export default function AdminLayout() {
  const navigate = useNavigate()
  const { auth: session, logout: authLogout } = useAuth()
  const grouped = adminNavigation.reduce((acc, item) => {
    acc[item.group] ||= []
    acc[item.group].push(item)
    return acc
  }, {})

  const logout = () => {
    authLogout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <Link to="/admin" className="mb-6 flex shrink-0 items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">JJ</span>
          <span>
            <span className="block text-sm font-bold">Panel administrativo</span>
            <span className="text-xs text-slate-500">Alojamiento JJ</span>
          </span>
        </Link>

        <nav className="admin-sidebar-scroll min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          {Object.entries(grouped).map(([group, links]) => (
            <div key={group}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{group}</p>
              <div className="space-y-1">
                {links.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/admin'}
                    className={({ isActive }) =>
                      [
                        'block rounded-md px-3 py-2 text-sm font-medium transition',
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                      ].join(' ')
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Sesion activa</p>
              <h1 className="text-lg font-semibold">{session?.nombreCompleto || session?.username || session?.email || 'Administrador'}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">
                Sitio publico
              </Link>
              <button type="button" onClick={logout} className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-950">
                Salir
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
