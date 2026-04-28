import { useState, useEffect } from 'react'
import { reservationService } from '../../api/reservationService'
import { useAuth } from '../../hooks/useAuth'
import Swal from 'sweetalert2'
import { getErrorMessage } from '../../utils/sweetAlert'
import { Link } from 'react-router-dom'

const EstadoBadge = ({ estado }) => {
  const configs = {
    PEN: { label: 'Pendiente', classes: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' },
    CON: { label: 'Confirmada', classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' },
    CAN: { label: 'Cancelada', classes: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300' },
    EXP: { label: 'Expirada', classes: 'bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-300' },
    FIN: { label: 'Finalizada', classes: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300' },
    EMI: { label: 'Emitida', classes: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300' },
  }
  const config = configs[estado] || { label: estado, classes: 'bg-gray-100 text-gray-800' }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest ${config.classes}`}>
      {config.label}
    </span>
  )
}

export default function MisReservasPage() {
  const { isAuthenticated } = useAuth()
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated()) {
      fetchReservas()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  const fetchReservas = async () => {
    try {
      setLoading(true)
      const response = await reservationService.getMisReservas({ limit: 100 })
      // Handle potential pagination format or direct array
      const data = response.items || response.data || response || []
      // Sort by date descending
      const sorted = Array.isArray(data) ? [...data].sort((a, b) => new Date(b.fechaRegistroUtc) - new Date(a.fechaRegistroUtc)) : []
      setReservas(sorted)
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: getErrorMessage(error) || 'No se pudieron cargar tus reservas.',
        icon: 'error',
        confirmButtonColor: '#4f46e5',
        background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#fff',
        color: document.documentElement.classList.contains('dark') ? '#f8fafc' : '#0f172a'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date)
  }

  if (!isAuthenticated()) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center rounded-[2rem] bg-white p-12 shadow-xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none border border-slate-100 dark:border-slate-800">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Debes iniciar sesión</h2>
          <p className="mt-4 text-slate-500 dark:text-slate-400">Por favor inicia sesión para ver tus reservas.</p>
          <div className="mt-8">
            <Link to="/login" className="rounded-full bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-500">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Mis Reservas</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Historial de todas tus reservas realizadas en Alojamiento JJ.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/habitaciones"
            className="inline-flex items-center rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-500"
          >
            Nueva Reserva
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : reservas.length === 0 ? (
        <div className="text-center rounded-[2rem] bg-white p-16 shadow-xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none border border-slate-100 dark:border-slate-800">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/20">
            <svg className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">No hay reservas</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Aún no has realizado ninguna reserva con nosotros.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reservas.map((reserva) => (
            <div key={reserva.idReserva || reserva.codigoReserva} className="flex flex-col overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-slate-200/50 transition hover:-translate-y-1 hover:shadow-2xl dark:bg-slate-900 dark:shadow-none border border-slate-100 dark:border-slate-800">
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    {reserva.codigoReserva}
                  </span>
                  <EstadoBadge estado={reserva.estadoReserva} />
                </div>
                
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {reserva.habitaciones && reserva.habitaciones.length > 0 
                    ? `Habitación ${reserva.habitaciones[0].numeroHabitacion || ''}`
                    : 'Alojamiento'}
                </h3>
                
                <div className="mt-4 grid grid-cols-2 gap-4 border-y border-slate-100 dark:border-slate-800 py-4">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Check-in</span>
                    <span className="block mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {formatDate(reserva.fechaInicio)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Check-out</span>
                    <span className="block mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {formatDate(reserva.fechaFin)}
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Total
                  </span>
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                    ${Number(reserva.totalReserva || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
