import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { reservationService } from '../../api/reservationService'
import { APP_CONFIG } from '../../config/appConfig'
import { useAuth } from '../../hooks/useAuth'
import { showError, showSuccess } from '../../utils/sweetAlert'
import { isReservableRoomState } from '../../utils/validation'
import RoomCard from '../../components/marketplace/RoomCard'
import ReservationSummary from '../../components/marketplace/ReservationSummary'
import DateRangePicker from '../../components/marketplace/DateRangePicker'
import PaymentModal from '../../components/marketplace/PaymentModal'

const money = (value) => Number((Number(value) || 0).toFixed(2))
const getAppliedPrice = (room) => Number(room.precioNocheAplicado ?? room.PrecioNocheAplicado ?? room.precioBase ?? 0)
const toApiDate = (value) => `${value}T00:00:00`
const pickGuid = (source, keys) => keys.map((key) => source?.[key]).find((value) => typeof value === 'string' && value)

const MarketplacePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, auth } = useAuth()
  const user = { ...(auth ?? {}), ...(auth?.user ?? {}) }
  const [rooms, setRooms] = useState([])
  const [selectedRooms, setSelectedRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [pricingLoading, setPricingLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState(null)
  const [dates, setDates] = useState({ checkIn: '', checkOut: '' })
  const [paymentResult, setPaymentResult] = useState(null)

  useEffect(() => {
    let alive = true

    const fetchRooms = async () => {
      setLoading(true)
      try {
        const params = {}
        if (dates.checkIn && dates.checkOut) {
          params.fechaInicio = toApiDate(dates.checkIn)
          params.fechaFin = toApiDate(dates.checkOut)
        }
        
        const data = await reservationService.getHabitaciones(params)
        if (alive) setRooms(data.filter((room) => isReservableRoomState(room.estadoHabitacion ?? room.EstadoHabitacion ?? 'DIS')))
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
    if (!isReservableRoomState(room.estadoHabitacion ?? room.EstadoHabitacion ?? 'DIS')) {
      showError('Habitacion no disponible', 'Solo puedes seleccionar habitaciones disponibles.')
      return
    }

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

  const selectedRoomKeys = useMemo(
    () => selectedRooms.map((room) => room.habitacionGuid).filter(Boolean).join('|'),
    [selectedRooms]
  )

  useEffect(() => {
    if (!dates.checkIn || !dates.checkOut || selectedRooms.length === 0) return

    let alive = true
    const fechaInicio = toApiDate(dates.checkIn)
    const fechaFin = toApiDate(dates.checkOut)

    const fetchAppliedPrices = async () => {
      setPricingLoading(true)
      try {
        const pricedRooms = await Promise.all(
          selectedRooms.map(async (room) => {
            if (!room.habitacionGuid) return room

            const price = await reservationService.calculatePublicRoomPrice({
              habitacionGuid: room.habitacionGuid,
              fechaInicio,
              fechaFin,
              canal: APP_CONFIG.CANAL_RESERVA,
            })

            return {
              ...room,
              precioNocheAplicado: money(price.precioNocheAplicado ?? price.PrecioNocheAplicado ?? room.precioBase),
              subtotalLinea: money(price.subtotalLinea ?? price.SubtotalLinea ?? 0),
              valorIvaLinea: money(price.valorIvaLinea ?? price.ValorIvaLinea ?? 0),
              totalLinea: money(price.totalLinea ?? price.TotalLinea ?? 0),
              origenPrecio: price.origenPrecio ?? price.OrigenPrecio ?? 'PRECIO_BASE',
            }
          })
        )

        if (alive) setSelectedRooms(pricedRooms)
      } catch (err) {
        console.error('Pricing error:', err?.response?.data || err)
        if (alive) showError('Error', 'No se pudo calcular el precio aplicado para la reserva.')
      } finally {
        if (alive) setPricingLoading(false)
      }
    }

    fetchAppliedPrices()

    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dates.checkIn, dates.checkOut, selectedRoomKeys])

  const totals = useMemo(() => {
    const subtotal = money(selectedRooms.reduce((acc, room) => acc + getAppliedPrice(room) * nights, 0))
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
      showError('Error', 'Selecciona fecha de entrada y salida.')
      return false
    }

    if (start < today) {
      showError('Error', 'La fecha de inicio no puede ser en el pasado.')
      return false
    }

    if (end <= start) {
      showError('Error', 'La fecha de fin debe ser posterior a la de inicio.')
      return false
    }

    if (selectedRooms.length === 0) {
      showError('Error', 'Selecciona al menos una habitacion.')
      return false
    }

    if (selectedRooms.some((room) => !isReservableRoomState(room.estadoHabitacion ?? room.EstadoHabitacion ?? 'DIS'))) {
      showError('Error', 'Solo puedes reservar habitaciones disponibles.')
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

  const buildReservaPayload = (clienteGuid) => {
    const fechaInicio = toApiDate(dates.checkIn)
    const fechaFin = toApiDate(dates.checkOut)
    const sucursalGuid = pickGuid(selectedRooms[0], ['sucursalGuid', 'SucursalGuid'])

    return {
      clienteGuid,
      sucursalGuid,
      fechaInicio,
      fechaFin,
      moneda: 'USD',
      Moneda: 'USD',
      descuentoAplicado: 0,
      observaciones: observaciones.trim(),
      esWalkin: false,
      habitaciones: selectedRooms.map((room) => {
        return {
          habitacionGuid: pickGuid(room, ['habitacionGuid', 'HabitacionGuid']),
          fechaInicio,
          fechaFin,
          numAdultos: 1,
          numNinos: 0,
          descuentoLinea: 0,
        }
      }),
    }
  }

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pendingPayload, setPendingPayload] = useState(null)

  const handleConfirmReservation = async (event) => {
    event.preventDefault()
    if (!validateSelection()) return
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    const hasUnpricedRooms = selectedRooms.some((room) => !Number(getAppliedPrice(room)))
    if (pricingLoading || hasUnpricedRooms) {
      showError('Error', 'Espera a que se calcule el precio aplicado antes de confirmar.')
      return
    }

    let clienteGuid = pickGuid(user, ['clienteGuid', 'ClienteGuid'])
    if (!clienteGuid) {
      try {
        const cliente = await reservationService.findClienteByEmail(user.email || user.correo)
        clienteGuid = pickGuid(cliente, ['clienteGuid', 'ClienteGuid'])
      } catch (error) {
        console.error('Cliente lookup error:', error?.response?.data || error)
      }
    }

    if (!clienteGuid) {
      showError('Error', 'No se pudo identificar tu perfil de cliente. Cierra sesion e inicia nuevamente.')
      return
    }

    if (selectedRooms.some((room) => !pickGuid(room, ['habitacionGuid', 'HabitacionGuid']))) {
      showError('Error', 'No se pudo identificar una de las habitaciones seleccionadas.')
      return
    }

    if (!pickGuid(selectedRooms[0], ['sucursalGuid', 'SucursalGuid'])) {
      showError('Error', 'No se pudo identificar la sucursal de la reserva.')
      return
    }

    const payload = buildReservaPayload(clienteGuid)
    setPendingPayload(payload)
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = (reserva) => {
    setPaymentResult({ success: true })
    setShowPaymentModal(false)
    setShowConfirm(false)
    setSelectedRooms([])
    setDates({ checkIn: '', checkOut: '' })
    setObservaciones('')
    setPendingPayload(null)
    
    const code = reserva?.codigoReserva || reserva?.CodigoReserva || reserva?.reservaGuid || reserva?.ReservaGuid || 'confirmada'
    showSuccess('Reserva completada', `Tu reserva ha sido pagada y creada correctamente. Codigo: ${code}.`)
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 dark:bg-black sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {paymentResult && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 flex items-center gap-3">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Pago realizado con éxito. Reserva aprobada y confirmada.
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
                <button type="submit" className="mt-6 w-full rounded-xl bg-indigo-600 py-4 text-center font-bold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                  Confirmar reserva
                </button>
              </form>
            )}

            <ReservationSummary
              selectedRooms={selectedRooms}
              nights={nights}
              totals={totals}
              loading={pricingLoading}
              onConfirm={handleContinueToReservation}
              confirmLabel={showConfirm ? 'Actualizar seleccion' : 'Continuar'}
            />
          </div>
        </div>
      </div>

      {showPaymentModal && pendingPayload && (
        <PaymentModal
          reservationData={pendingPayload}
          user={user}
          total={totals.total}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  )
}

export default MarketplacePage
