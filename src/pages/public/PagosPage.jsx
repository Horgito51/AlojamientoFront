import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { reservationService } from '../../api/reservationService'
import { useAuth } from '../../hooks/useAuth'
import { showError, showSuccess } from '../../utils/sweetAlert'
import PaymentModal from '../../components/marketplace/PaymentModal'

const money = (value) => Number(Number(value) || 0).toFixed(2)
const MAX_PAYMENT_WINDOW_MS = 60 * 60 * 1000
const getReservationDate = (reserva) =>
  reserva?.fechaReservaUtc || reserva?.fechaRegistroUtc || reserva?.fechaCreacionUtc || reserva?.createdAt || null
const isExpiredForPayment = (reserva) => {
  const rawDate = getReservationDate(reserva)
  if (!rawDate) return false
  const createdAtMs = new Date(rawDate).getTime()
  if (Number.isNaN(createdAtMs)) return false
  return Date.now() - createdAtMs > MAX_PAYMENT_WINDOW_MS
}

export default function PagosPage() {
  const { isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [reservas, setReservas] = useState([])
  const [selectedReserva, setSelectedReserva] = useState(null)

  const fetchReservas = useCallback(async () => {
    try {
      setLoading(true)
      const response = await reservationService.getMisReservas({ limit: 100 })
      let data = response.items || response.data || response || []
      data = Array.isArray(data) ? data : []

      const expiradas = data.filter((reserva) => {
        const estado = String(reserva?.estadoReserva || '').toUpperCase()
        const saldoPendiente = Number(reserva?.saldoPendiente || 0)
        const guid = reserva?.reservaGuid || reserva?.ReservaGuid
        return guid && saldoPendiente > 0 && estado !== 'CAN' && isExpiredForPayment(reserva)
      })

      if (expiradas.length > 0) {
        for (const reserva of expiradas) {
          const guid = reserva?.reservaGuid || reserva?.ReservaGuid
          // #region agent log
          fetch('http://127.0.0.1:7287/ingest/a863e764-f433-436b-a439-7ec838c455cd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'86bafb'},body:JSON.stringify({sessionId:'86bafb',runId:'initial',hypothesisId:'H22',location:'src/pages/public/PagosPage.jsx:fetchReservas:autoCancelExpired',message:'Auto-cancel expired unpaid reservation',data:{reservaGuid:guid,fechaReserva:getReservationDate(reserva)},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
          await reservationService.cancelPublicReserva(guid, 'Cancelacion automatica por falta de pago dentro de 1 hora.')
        }

        const refreshed = await reservationService.getMisReservas({ limit: 100 })
        const refreshedData = refreshed.items || refreshed.data || refreshed || []
        data = Array.isArray(refreshedData) ? refreshedData : []
      }

      setReservas(data)
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
    () =>
      reservas.filter((r) => {
        const estado = String(r?.estadoReserva || '').toUpperCase()
        return Number(r?.saldoPendiente || 0) > 0 && estado !== 'CAN' && !isExpiredForPayment(r)
      }),
    [reservas]
  )

  const handleOpenPayment = (reserva) => {
    // #region agent log
    fetch('http://127.0.0.1:7287/ingest/a863e764-f433-436b-a439-7ec838c455cd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'86bafb'},body:JSON.stringify({sessionId:'86bafb',runId:'initial',hypothesisId:'H20',location:'src/pages/public/PagosPage.jsx:handleOpenPayment',message:'Open payment modal from payments section',data:{reservaGuid:reserva?.reservaGuid||reserva?.ReservaGuid,saldoPendiente:reserva?.saldoPendiente,totalReserva:reserva?.totalReserva},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    setSelectedReserva(reserva)
  }

  const handlePaymentSuccess = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7287/ingest/a863e764-f433-436b-a439-7ec838c455cd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'86bafb'},body:JSON.stringify({sessionId:'86bafb',runId:'initial',hypothesisId:'H21',location:'src/pages/public/PagosPage.jsx:handlePaymentSuccess',message:'Payment success callback from payments section',data:{reservaGuid:selectedReserva?.reservaGuid||selectedReserva?.ReservaGuid},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    setSelectedReserva(null)
    await fetchReservas()
    showSuccess('Pago completado', 'El pago se registró correctamente para tu reserva.')
  }

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
        <p className="text-sm mt-1">Recuerda: tienes maximo 1 hora para pagar. Si no pagas en ese tiempo, la reserva se cancela automaticamente.</p>
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
                <button
                  type="button"
                  onClick={() => handleOpenPayment(reserva)}
                  className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Pagar ahora
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedReserva && (
        <PaymentModal
          reservationData={null}
          existingReservation={selectedReserva}
          user={{}}
          total={Number(selectedReserva?.saldoPendiente || selectedReserva?.totalReserva || 0)}
          onSuccess={handlePaymentSuccess}
          onClose={() => setSelectedReserva(null)}
        />
      )}
    </div>
  )
}
