import React from 'react'

export default function Header({ onRoomsClick, onLoginClick }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
            <span className="font-semibold">JJ</span>
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Alojamiento JJ</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Hospedaje con estilo para tu próxima estadía</p>
          </div>
        </div>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
          <button type="button" onClick={onRoomsClick} className="transition hover:text-indigo-600 dark:hover:text-indigo-400">
            Habitaciones
          </button>
          <button type="button" onClick={onRoomsClick} className="transition hover:text-indigo-600 dark:hover:text-indigo-400">
            Promociones
          </button>
          <button type="button" className="transition hover:text-indigo-600 dark:hover:text-indigo-400">
            Sobre nosotros
          </button>
          <button type="button" className="transition hover:text-indigo-600 dark:hover:text-indigo-400">
            Contacto
          </button>
        </nav>

        <div className="flex items-center gap-3">
          {onLoginClick && (
            <button
              type="button"
              onClick={onLoginClick}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500"
            >
              Iniciar sesión
            </button>
          )}
          <button
            type="button"
            onClick={onRoomsClick}
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            Ver habitaciones
          </button>
        </div>
      </div>
    </header>
  )
}
