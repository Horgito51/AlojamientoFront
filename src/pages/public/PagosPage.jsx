import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { reservationService } from '../../api/reservationService'
import { useAuth } from '../../hooks/useAuth'
import { showError } from '../../utils/sweetAlert'

const money = (value) => Number(Number(value) || 0).toFixed(2)

export default function PagosPage() {
  const { isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [reservas, setReservas] = useState([])

  const fetchReservas = useCallback(async () => {
    try {
      setLoading(true)
      const response = await reservationService.getMisReservas({ limit: 100 })
      const data = response.items || response.data || response || []
      setReservas(Array.isArray(data) ? data : [])
    } catch (error) {
      showError('Error', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated()) fetchReservas()
  }, [fetchReservas, isAuthenticated])

  const pendientes = useMemo(
    () => reservas.filter((r) => Number(r?.saldoPendiente || 0) > 0 && String(r?.estadoReserva || '').toUpperCase() !== 'CAN'),
    [reservas]
  )

  if (!isAuthenticated()) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-2xl font-bold">Debes iniciar sesion para pagar</h1>
          <p className="mt-2 text-slate-500">Inicia sesion para ver tus reservas pendientes de pago.</p>
          <Link to="/login" className="mt-4 inline-block rounded-full bg-indigo-600 px-5 py-2 font-semibold text-white">
            Iniciar sesion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200">
        <p className="font-semibold">Centro de pagos</p>
        <p className="text-sm mt-1">Recuerda: despues de crear tu reserva, puedes cancelarla dentro de 3 dias.</p>
      </div>

      {loading ? (
        <div className="py-12 text-center">Cargando reservas pendientes...</div>
      ) : pendientes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="font-semibold">No tienes pagos pendientes.</p>
          <Link to="/habitaciones" className="mt-4 inline-block rounded-full bg-indigo-600 px-5 py-2 font-semibold text-white">
            Crear nueva reserva
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendientes.map((reserva) => (
            <div key={reserva.reservaGuid || reserva.codigoReserva} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">{reserva.codigoReserva || 'Reserva'}</p>
                  <p className="font-semibold">Saldo pendiente: ${money(reserva.saldoPendiente || reserva.totalReserva)}</p>
                </div>
                <Link to="/mis-reservas" className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                  Ir a pagar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
