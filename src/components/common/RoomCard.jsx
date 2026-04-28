import React from 'react'
import { Link } from 'react-router-dom'
import { getRoomImageUrl } from '../../utils/roomImages'

export default function RoomCard({ room }) {
  const id = room.idHabitacion || room.IdHabitacion || room.id || room.Id || room.habitacionId || 1
  const title = room.nombreTipoHabitacion || room.nombre || room.name || room.tipo || 'Habitacion destacada'
  const description = room.descripcionHabitacion || room.descripcion || room.description || room.summary || 'Disfruta un entorno confortable con servicios incluidos y atencion personalizada.'
  const priceValue = room.precioBase ?? room.precio ?? room.price ?? room.tarifa ?? 35
  const price = typeof priceValue === 'number' ? `$${priceValue.toFixed(2)}` : priceValue
  const guests = room.capacidadHabitacion || room.capacidadTotal || room.capacidad || room.capacity || room.maxGuests || '2'
  const image = getRoomImageUrl(room)

  return (
    <article className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-lg shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800/80 dark:bg-slate-900 dark:shadow-black/20">
      <div className="relative h-56 overflow-hidden">
        {image ? (
          <img src={image} alt={title} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-900 text-sm font-semibold text-slate-300">
            Sin imagen
          </div>
        )}
      </div>
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h3>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-900/80 dark:text-indigo-100">{guests} pax</span>
        </div>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
        <div className="flex items-center justify-between gap-4">
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{price}</p>
          <Link to={`/habitaciones/${id}`} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
            Ver detalle
          </Link>
        </div>
      </div>
    </article>
  )
}
