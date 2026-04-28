import React from 'react'

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-slate-50 px-4 py-10 text-slate-700 dark:border-slate-800/80 dark:bg-slate-950 dark:text-slate-300 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Alojamiento JJ</p>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
              Vive la experiencia de un hospedaje cómodo y cercano, con opciones para parejas, familias y viajeros de negocios.
            </p>
          </div>

          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Enlaces rápidos</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>Inicio</li>
              <li>Habitaciones</li>
              <li>Reservas</li>
              <li>Contacto</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Contáctanos</p>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
              Calle Principal 123, Cuenca · +593 9 1234 5678 · hola@alojamientojj.ec
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200/80 pt-6 text-sm text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
          © {new Date().getFullYear()} Alojamiento JJ. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}
