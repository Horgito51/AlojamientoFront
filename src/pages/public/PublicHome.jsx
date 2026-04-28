import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { bookingApi } from '../../api/bookingApi'
import RoomCard from '../../components/common/RoomCard'
import { useAuth } from '../../hooks/useAuth'

const fallbackRooms = [
  {
    id: 1,
    idHabitacion: 1,
    idSucursal: 1,
    nombreTipoHabitacion: 'Suite Premium',
    descripcionHabitacion: 'Espacio amplio con cama king, desayuno incluido y vista a la ciudad.',
    precioBase: 49,
    capacidadHabitacion: 2,
  },
  {
    id: 2,
    idHabitacion: 2,
    idSucursal: 1,
    nombreTipoHabitacion: 'Familiar Deluxe',
    descripcionHabitacion: 'Habitacion ideal para familias con wifi, aire acondicionado y sala compacta.',
    precioBase: 39,
    capacidadHabitacion: 4,
  },
  {
    id: 3,
    idHabitacion: 3,
    idSucursal: 1,
    nombreTipoHabitacion: 'Estandar Confort',
    descripcionHabitacion: 'Comoda, funcional y perfecta para viajes de trabajo o escapadas cortas.',
    precioBase: 29,
    capacidadHabitacion: 2,
  },
]

export default function PublicHome() {
  const navigate = useNavigate()
  const { isAuthenticated, hasRole } = useAuth()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    bookingApi.search('')
      .then((items) => alive && setRooms(items.length ? items.slice(0, 3) : fallbackRooms))
      .catch(() => alive && setRooms(fallbackRooms))
      .finally(() => alive && setLoading(false))

    return () => {
      alive = false
    }
  }, [])

  return (
    <main>
      <section className="relative overflow-hidden bg-white dark:bg-slate-950">
        <div className="mx-auto grid min-h-[560px] max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
          <div className="space-y-7">
            <p className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
              Reservas directas en Cuenca
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
                Encuentra una habitacion lista para descansar hoy.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
                Revisa disponibilidad, compara tipos de habitacion y deja tu reserva pendiente para que el equipo la confirme.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/habitaciones" className="rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                Buscar habitaciones
              </Link>
              <Link to="/login" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                Panel administrativo
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <img
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85"
              alt="Habitacion de hotel moderna"
              className="h-[420px] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Destacadas</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">Habitaciones disponibles</h2>
          </div>
          <Link to="/habitaciones" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
            Ver todo
          </Link>
        </div>

        {loading ? (
          <div className="rounded-lg bg-white p-8 text-center text-slate-500 dark:bg-slate-900">Cargando habitaciones...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room, index) => <RoomCard key={room.idHabitacion || room.id || index} room={room} />)}
          </div>
        )}
      </section>
    </main>
  )
}
