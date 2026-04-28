import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { reservationService } from '../../api/reservationService'
import { APP_CONFIG } from '../../config/appConfig'
import { useAuth } from '../../hooks/useAuth'
import RoomCard from '../../components/marketplace/RoomCard'
import ReservationSummary from '../../components/marketplace/ReservationSummary'
import DateRangePicker from '../../components/marketplace/DateRangePicker'
import PaymentModal from '../../components/marketplace/PaymentModal'

const money = (value) => Number((Number(value) || 0).toFixed(2))
const getRoomId = (room) => Number(room.idHabitacion ?? room.IdHabitacion ?? room.id ?? room.Id)
const getRoomSucursalId = (room) => Number(room.idSucursal ?? room.IdSucursal ?? room.sucursalId ?? APP_CONFIG.DEFAULT_SUCURSAL_ID)
const toApiDate = (value) => new Date(`${value}T12:00:00`).toISOString()

const getApiMessage = (error) => {
  console.error('Reservation error:', error?.response?.data || error)

  const data = error?.response?.data
  if (!data) return error?.message || 'No se pudo crear la reserva.'
  if (typeof data === 'string') {
    return data.includes('No se generaron detalles de reserva')
      ? 'No pudimos confirmar la reserva en este momento. Intenta de nuevo en unos segundos.'
      : data
  }
  if (typeof data.message === 'string') {
    return data.message.includes('No se generaron detalles de reserva')
      ? 'No pudimos confirmar la reserva en este momento. Intenta de nuevo en unos segundos.'
      : data.message
  }
  if (typeof data.error === 'string') {
    return data.error.includes('No se generaron detalles de reserva')
      ? 'No pudimos confirmar la reserva en este momento. Intenta de nuevo en unos segundos.'
      : data.error
  }
  if (typeof data.title === 'string') return data.title

  const errors = data.errors || data.Errors
  if (errors && typeof errors === 'object') {
    return Object.entries(errors)
      .flatMap(([field, messages]) => {
        const list = Array.isArray(messages) ? messages : [messages]
        return list.map((message) => `${field}: ${message}`)
      })
      .join('\n')
  }

  return 'No se pudo crear la reserva.'
}

const isAuthError = (error) => {
  const status = error?.response?.status
  if (status === 401 || status === 403) return true

  const rawMessage = [
    error?.response?.data?.message,
    error?.response?.data?.error,
    error?.response?.data?.title,
    error?.message,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return ['token', 'autenticado', 'autoriz', 'sesion', 'cliente asociado'].some((term) => rawMessage.includes(term))
}

const MarketplacePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const [rooms, setRooms] = useState([])
  const [selectedRooms, setSelectedRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState(null)
  const [dates, setDates] = useState({ checkIn: '', checkOut: '' })
  const [createdReservation, setCreatedReservation] = useState(null)
  const [paymentResult, setPaymentResult] = useState(null)

  useEffect(() => {
    let alive = true

    const fetchRooms = async () => {
      setLoading(true)
      try {
        const params = {}
        if (dates.checkIn && dates.checkOut) {
          params.fechaInicio = dates.checkIn
          params.fechaFin = dates.checkOut
        }
        
        const data = await reservationService.getHabitaciones(params)
        if (alive) setRooms(data)
      } catch (err) {
        console.error('Rooms error:', err?.response?.data || err)
        if (alive) setError('Error al cargar las habitaciones. Por favor, intenta de nuevo mas tarde.')
      } finally {
        if (alive) setLoading(false)
      }
    }

    fetchRooms()

    return () => {
      alive = false
    }
  }, [dates.checkIn, dates.checkOut])

  const handleToggleRoom = (room) => {
    setSelectedRooms((prev) => {
      const isAlreadySelected = prev.find((r) => r.habitacionGuid === room.habitacionGuid)
      if (isAlreadySelected) return prev.filter((r) => r.habitacionGuid !== room.habitacionGuid)
      return [...prev, room]
    })
  }

  const nights = useMemo(() => {
    if (!dates.checkIn || !dates.checkOut) return 0
    const start = new Date(`${dates.checkIn}T00:00:00`)
    const end = new Date(`${dates.checkOut}T00:00:00`)
    const diffDays = Math.ceil((end - start) / 86400000)
    return diffDays > 0 ? diffDays : 0
  }, [dates])

  const totals = useMemo(() => {
    const subtotal = money(selectedRooms.reduce((acc, room) => acc + (Number(room.precioBase) || 0) * nights, 0))
    const iva = money(subtotal * APP_CONFIG.IVA_PERCENTAGE)
    const total = money(subtotal + iva)
    return { subtotal, iva, total, pending: total }
  }, [selectedRooms, nights])

  const handleDateChange = (event) => {
    const { name, value } = event.target
    setDates((prev) => ({ ...prev, [name]: value }))
    setShowConfirm(false)
  }

  const validateSelection = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(`${dates.checkIn}T00:00:00`)
    const end = new Date(`${dates.checkOut}T00:00:00`)

    if (!dates.checkIn || !dates.checkOut) {
      Swal.fire('Error', 'Selecciona fecha de entrada y salida.', 'error')
      return false
    }

    if (start < today) {
      Swal.fire('Error', 'La fecha de inicio no puede ser en el pasado.', 'error')
      return false
    }

    if (end <= start) {
      Swal.fire('Error', 'La fecha de fin debe ser posterior a la de inicio.', 'error')
      return false
    }

    if (selectedRooms.length === 0) {
      Swal.fire('Error', 'Selecciona al menos una habitacion.', 'error')
      return false
    }

    return true
  }

  const handleContinueToReservation = () => {
    if (!validateSelection()) return

    if (!isAuthenticated()) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    setShowConfirm(true)
  }

  const buildReservaPayload = () => {
    const fechaInicio = toApiDate(dates.checkIn)
    const fechaFin = toApiDate(dates.checkOut)

    return {
      idSucursal: getRoomSucursalId(selectedRooms[0]),
      fechaInicio,
      fechaFin,
      subtotalReserva: totals.subtotal,
      valorIva: totals.iva,
      totalReserva: totals.total,
      descuentoAplicado: 0,
      saldoPendiente: totals.pending,
      origenCanalReserva: APP_CONFIG.CANAL_RESERVA,
      estadoReserva: APP_CONFIG.ESTADO_RESERVA_INICIAL,
      observaciones: observaciones.trim(),
      esWalkin: false,
      habitaciones: selectedRooms.map((room) => {
        const subtotalLinea = money((Number(room.precioBase) || 0) * nights)
        const valorIvaLinea = money(subtotalLinea * APP_CONFIG.IVA_PERCENTAGE)

        return {
          idHabitacion: getRoomId(room),
          idTarifa: null,
          fechaInicio,
          fechaFin,
          numAdultos: 1,
          numNinos: 0,
          precioNocheAplicado: money(room.precioBase),
          subtotalLinea,
          valorIvaLinea,
          descuentoLinea: 0,
          totalLinea: money(subtotalLinea + valorIvaLinea),
          estadoDetalle: APP_CONFIG.ESTADO_RESERVA_INICIAL,
        }
      }),
    }
  }

  const handleConfirmReservation = async (event) => {
    event.preventDefault()
    if (!validateSelection()) return
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    setSubmitting(true)
    try {
      const reserva = await reservationService.createPublicReserva(buildReservaPayload())
      const code = reserva?.codigoReserva || reserva?.idReserva || 'pendiente'

      setCreatedReservation(reserva)
      setPaymentResult(null)
      Swal.fire('Exito', `Tu reserva ha sido creada correctamente. Codigo: ${code}.`, 'success')
    } catch (err) {
      if (isAuthError(err)) {
        setShowConfirm(false)
        await Swal.fire('Inicia sesion', 'Tu sesion no esta disponible. Vuelve a iniciar sesion para continuar.', 'info')
        navigate('/login', { state: { from: location.pathname } })
        return
      }

      Swal.fire('Error', getApiMessage(err), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaymentSuccess = (result) => {
    setPaymentResult(result)
    setCreatedReservation((current) => ({
      ...current,
      estadoReserva: result?.estadoReserva || 'APR',
      saldoPendiente: 0,
    }))
    Swal.fire('Pago realizado con exito', 'Reserva aprobada.', 'success')
    setSelectedRooms([])
    setDates({ checkIn: '', checkOut: '' })
    setObservaciones('')
    setShowConfirm(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 dark:bg-black sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {paymentResult && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            Pago realizado con exito. Reserva aprobada.
          </div>
        )}

        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Encuentra tu Estancia Perfecta
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Explora nuestras habitaciones exclusivas y reserva en segundos.
          </p>
        </div>

        <DateRangePicker
          checkIn={dates.checkIn}
          checkOut={dates.checkOut}
          onChange={handleDateChange}
          nights={nights}
        />

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-2xl bg-red-50 p-8 text-center text-red-600">
                {error}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {rooms.map((room) => (
                  <RoomCard
                    key={room.habitacionGuid}
                    room={room}
                    isSelected={selectedRooms.some((r) => r.habitacionGuid === room.habitacionGuid)}
                    onToggle={handleToggleRoom}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            {showConfirm && (
              <form onSubmit={handleConfirmReservation} className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Confirmar reserva</h2>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Observaciones
                  <textarea
                    name="observaciones"
                    value={observaciones}
                    onChange={(event) => setObservaciones(event.target.value)}
                    rows="3"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    placeholder="Opcional"
                  />
                </label>
                <button type="submit" disabled={submitting} className="mt-6 w-full rounded-xl bg-indigo-600 py-4 text-center font-bold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {submitting ? 'Confirmando...' : 'Confirmar reserva'}
                </button>
              </form>
            )}

            <ReservationSummary
              selectedRooms={selectedRooms}
              nights={nights}
              totals={totals}
              loading={submitting}
              onConfirm={handleContinueToReservation}
              confirmLabel={showConfirm ? 'Actualizar seleccion' : 'Continuar'}
            />
          </div>
        </div>
      </div>

      {createdReservation && !paymentResult && (
        <PaymentModal
          reservation={createdReservation}
          total={createdReservation.totalReserva ?? createdReservation.TotalReserva ?? totals.total}
          onSuccess={handlePaymentSuccess}
          onClose={() => setCreatedReservation(null)}
        />
      )}
    </div>
  )
}

export default MarketplacePage
