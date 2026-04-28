import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { bookingApi } from '../../api/bookingApi'
import { getRoomImageUrl } from '../../utils/roomImages'

export default function RoomDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    Promise.all([bookingApi.getAccommodation(id), bookingApi.getReviews(id).catch(() => [])])
      .then(([roomData, reviewData]) => {
        if (!alive) return
        setRoom(roomData)
        setReviews(reviewData)
      })
      .catch(() => alive && setError('No se pudo cargar el detalle de la habitacion.'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [id])

  if (loading) return <main className="p-8 text-center">Cargando detalle...</main>
  if (error || !room) return <main className="p-8 text-center text-red-600">{error || 'Habitacion no encontrada.'}</main>

  const title = room.nombreTipoHabitacion || room.nombre || room.name || `Habitacion ${room.numeroHabitacion || id}`
  const price = Number(room.precioBase ?? room.precio ?? room.price ?? 35)
  const capacity = room.capacidadHabitacion ?? room.capacidadTotal ?? room.capacidad ?? 2
  const image = getRoomImageUrl(room)

  const reserve = () => {
    navigate('/reserva', { state: { room } })
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/habitaciones" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">Volver a habitaciones</Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
          {image ? (
            <img src={image} alt={title} className="h-[460px] w-full object-cover" />
          ) : (
            <div className="flex h-[460px] w-full items-center justify-center bg-slate-900 text-sm font-semibold text-slate-300">
              Sin imagen
            </div>
          )}
        </div>
        <section className="space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Detalle</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{title}</h1>
          </div>
          <p className="leading-7 text-slate-600 dark:text-slate-300">
            {room.descripcionHabitacion || room.descripcion || 'Habitacion comoda con servicios esenciales para una estancia tranquila.'}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs text-slate-500">Capacidad</p>
              <p className="text-lg font-semibold">{capacity} pax</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs text-slate-500">Precio base</p>
              <p className="text-lg font-semibold">${price.toFixed(2)}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs text-slate-500">Estado</p>
              <p className="text-lg font-semibold">{room.estadoHabitacion || 'DIS'}</p>
            </div>
          </div>
          <button onClick={reserve} className="w-full rounded-md bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500">
            Reservar esta habitacion
          </button>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">Valoraciones</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {reviews.length === 0 ? (
            <p className="rounded-lg bg-white p-5 text-slate-500 dark:bg-slate-900">Aun no hay valoraciones publicadas.</p>
          ) : reviews.map((review, index) => (
            <article key={review.idValoracion || index} className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="font-semibold">Puntuacion limpieza: {review.puntuacionLimpieza ?? '-'}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{review.comentarioPositivo || review.comentarioNegativo || 'Sin comentario.'}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
