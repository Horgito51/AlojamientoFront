import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'

function ThemeButton() {
  const { isDark, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      className="h-10 w-10 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDark ? 'L' : 'S'}
    </button>
  )
}

export default function PublicLayout() {
  const navigate = useNavigate()
  const { isAuthenticated, logout, hasRole } = useAuth()
  const loggedIn = isAuthenticated()
  const isAdmin = hasRole('ADMINISTRADOR') || hasRole('ADMIN') || hasRole('OPERATIVO') || hasRole('DESK_SERVICE')

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm">
              JJ
            </span>
            <span>
              <span className="block text-sm font-bold text-slate-950 dark:text-white">Alojamiento JJ</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Hospedaje en Cuenca</span>
            </span>
          </Link>
 
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
            <Link className="hover:text-indigo-600 transition-colors" to="/habitaciones">Habitaciones</Link>
            <Link className="hover:text-indigo-600 transition-colors" to="/reserva">Reservar</Link>
            {loggedIn && <Link className="hover:text-indigo-600 transition-colors" to="/mis-reservas">Mis Reservas</Link>}
            {isAdmin && <Link className="font-bold text-indigo-600 dark:text-indigo-400" to="/admin">Admin</Link>}
            <a href="/#sobre-nosotros" className="hover:text-indigo-600 transition-colors">Sobre Nosotros</a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeButton />
            {!loggedIn ? (
              <>
                <Link
                  to="/login"
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  Iniciar sesion
                </Link>
                <Link
                  to="/register"
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  Registrarse
                </Link>
              </>
            ) : (
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                Salir
              </button>
            )}
            <Link
              to="/habitaciones"
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              Ver habitaciones
            </Link>
          </div>
        </div>
      </header>

      <Outlet />

      <footer className="border-t border-slate-200 bg-white px-4 py-12 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-sm">
                  JJ
                </span>
                <span className="text-lg font-bold text-slate-950 dark:text-white">Alojamiento JJ</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Tu hogar lejos de casa en la ciudad de Cuenca. Comodidad y elegancia a tu alcance.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white">Enlaces</h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><Link to="/habitaciones" className="hover:text-indigo-600">Habitaciones</Link></li>
                <li><Link to="/reserva" className="hover:text-indigo-600">Reservar</Link></li>
                <li><a href="#sobre-nosotros" className="hover:text-indigo-600">Sobre Nosotros</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white">Contacto</h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>Cuenca, Ecuador</li>
                <li>info@alojamientojj.com</li>
                <li>+593 99 999 9999</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white">Redes</h4>
              <div className="mt-4 flex gap-4">
                {/* Placeholder for social icons */}
                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800" />
                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800" />
                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-slate-100 pt-8 text-center text-xs text-slate-400 dark:border-slate-900">
            <p>© {new Date().getFullYear()} Alojamiento JJ. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
