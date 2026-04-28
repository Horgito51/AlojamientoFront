import { useEffect, useMemo, useState } from 'react'
import RoomCard from '../../components/common/RoomCard'
import { bookingApi } from '../../api/bookingApi'

export default function RoomsPage() {
  const [rooms, setRooms] = useState([])
  const [categories, setCategories] = useState([])
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ ciudad: '', adultos: 1, ninos: 0, tipo: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    Promise.all([bookingApi.search(''), bookingApi.getCategories()])
      .then(([roomItems, categoryItems]) => {
        if (!alive) return
        setRooms(roomItems)
        setCategories(categoryItems)
      })
      .catch(() => alive && setError('No se pudo cargar el catalogo. Verifica que el backend este activo.'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const text = JSON.stringify(room).toLowerCase()
      const matchesQuery = !query || text.includes(query.toLowerCase())
      const matchesType = !filters.tipo || text.includes(filters.tipo.toLowerCase())
      const capacity = Number(room.capacidadHabitacion ?? room.capacidadTotal ?? room.capacidad ?? room.maxGuests ?? 0)
      const matchesGuests = capacity === 0 || capacity >= Number(filters.adultos) + Number(filters.ninos)
      return matchesQuery && matchesType && matchesGuests
    })
  }, [rooms, query, filters])

  const runSearch = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const items = await bookingApi.search(query || filters.ciudad || filters.tipo)
      setRooms(items)
    } catch {
      setError('La busqueda no respondio. Se mantiene la lista cargada.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Catalogo</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">Habitaciones</h1>
      </div>

      <form onSubmit={runSearch} className="mb-8 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-6">
        <input className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Buscar por ciudad, tipo o descripcion" value={query} onChange={(e) => setQuery(e.target.value)} />
        <input className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Ciudad" value={filters.ciudad} onChange={(e) => setFilters((p) => ({ ...p, ciudad: e.target.value }))} />
        <select className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={filters.tipo} onChange={(e) => setFilters((p) => ({ ...p, tipo: e.target.value }))}>
          <option value="">Tipo</option>
          {categories.map((category) => (
            <option key={category.idTipoHabitacion || category.id || category.nombreTipoHabitacion} value={category.nombreTipoHabitacion || category.nombre || category.codigoTipoHabitacion}>
              {category.nombreTipoHabitacion || category.nombre || category.codigoTipoHabitacion}
            </option>
          ))}
        </select>
        <input className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" type="number" min="1" value={filters.adultos} onChange={(e) => setFilters((p) => ({ ...p, adultos: e.target.value }))} aria-label="Adultos" />
        <input className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" type="number" min="0" value={filters.ninos} onChange={(e) => setFilters((p) => ({ ...p, ninos: e.target.value }))} aria-label="Ninos" />
        <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Buscar</button>
      </form>

      {error && <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>}

      {loading ? (
        <div className="rounded-lg bg-white p-8 text-center dark:bg-slate-900">Cargando...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredRooms.map((room, index) => <RoomCard key={room.idHabitacion || room.id || index} room={room} />)}
        </div>
      )}
    </main>
  )
}
