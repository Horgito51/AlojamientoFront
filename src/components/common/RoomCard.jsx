import React from 'react'
import { Link } from 'react-router-dom'
import { getRoomImageUrl } from '../../utils/roomImages'

export default function RoomCard({ room }) {
  const id = room.idHabitacion || room.IdHabitacion || room.id || room.Id || room.habitacionId || 1
  const title = room.nombreTipoHabitacion || room.nombre || room.name || room.tipo || 'Habitacion destacada'
  const description = room.descripcionHabitacion || room.descripcion || room.description || room.summary || 'Disfruta un entorno confortable con servicios incluidos y atencion personalizada.'
  const priceValue = room.precioBase ?? room.precio ?? room.price ?? room.tarifa ?? 35
  const formattedPrice = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(priceValue) || 0)
  const guests = room.capacidadHabitacion || room.capacidadTotal || room.capacidad || room.capacity || room.maxGuests || '2'
  const image = getRoomImageUrl(room)

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-indigo-500/10">
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {image ? (
          <img 
            src={image} 
            alt={title} 
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
            <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-900 backdrop-blur-md dark:bg-slate-900/90 dark:text-white">
          {guests} huéspedes
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-2">
          <h3 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
            {title}
          </h3>
        </div>
        
        <p className="mb-6 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
          {description}
        </p>

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Desde</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{formattedPrice}<span className="text-sm font-normal text-slate-400">/noche</span></p>
          </div>
          <Link 
            to={`/habitaciones/${id}`} 
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-indigo-600 transition-all hover:bg-indigo-600 hover:text-white dark:bg-slate-800 dark:text-indigo-400 dark:hover:bg-indigo-600 dark:hover:text-white"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  )
}
