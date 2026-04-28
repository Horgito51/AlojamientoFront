import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { buildClientePayload, buildReservationTotals, buildReservaPayload, reservasApi } from '../../api/reservasApi'

const initialForm = {
  tipoIdentificacion: 'CED',
  numeroIdentificacion: '',
  nombres: '',
  apellidos: '',
  correo: '',
  telefono: '',
  direccion: '',
  fechaInicio: '',
  fechaFin: '',
  observaciones: '',
}

const getRoomPrice = (room) => Number(room?.precioBase ?? room?.precio ?? room?.price ?? 35)
const getRoomId = (room) => room?.idHabitacion ?? room?.IdHabitacion ?? room?.id
const getRoomTitle = (room) => room?.nombreTipoHabitacion || room?.nombre || room?.name || `Habitacion ${getRoomId(room) || ''}`

export default function ReservationPage() {
  const { state } = useLocation()
  const selectedRoom = state?.room
  const [form, setForm] = useState(initialForm)
  const [manualRoom, setManualRoom] = useState({
    idHabitacion: selectedRoom ? '' : '1',
    idSucursal: selectedRoom ? '' : '1',
    precioBase: selectedRoom ? '' : '35',
    nombreTipoHabitacion: selectedRoom ? '' : 'Habitacion seleccionada',
  })
  const [status, setStatus] = useState({ type: '', message: '' })
  const [saving, setSaving] = useState(false)

  const room = selectedRoom || manualRoom
  const totals = useMemo(
    () => buildReservationTotals({ startDate: form.fechaInicio, endDate: form.fechaFin, price: getRoomPrice(room) }),
    [form.fechaInicio, form.fechaFin, room],
  )

  const update = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const updateRoom = (event) => {
    const { name, value } = event.target
    setManualRoom((current) => ({ ...current, [name]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setStatus({ type: '', message: '' })

    if (!getRoomId(room)) {
      setStatus({ type: 'error', message: 'Selecciona una habitacion desde el catalogo o ingresa el ID manualmente.' })
      return
    }

    setSaving(true)
    try {
      const cliente = await reservasApi.createCliente(buildClientePayload(form))
      const clienteId = cliente.idCliente ?? cliente.IdCliente ?? cliente.id
      const reserva = await reservasApi.createReserva(buildReservaPayload({ clienteId, room, form, totals }))
      setStatus({
        type: 'success',
        message: `Reserva enviada correctamente. Codigo interno: ${reserva.idReserva ?? reserva.IdReserva ?? 'pendiente'}.`,
      })
      setForm(initialForm)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || error.response?.data?.error || 'No se pudo enviar la reserva. Revisa los datos y el backend.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Reserva</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">Completa tu solicitud</h1>
        <p className="mt-2 text-sm text-slate-500">Tu reserva quedara pendiente hasta confirmacion del equipo.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submit} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <section>
            <h2 className="mb-4 text-lg font-semibold">Datos del huesped</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <select name="tipoIdentificacion" value={form.tipoIdentificacion} onChange={update} className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                <option value="CED">Cedula</option>
                <option value="PAS">Pasaporte</option>
                <option value="RUC">RUC</option>
              </select>
              <input required name="numeroIdentificacion" value={form.numeroIdentificacion} onChange={update} placeholder="Numero de identificacion" className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
              <input required name="nombres" value={form.nombres} onChange={update} placeholder="Nombres" className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
              <input required name="apellidos" value={form.apellidos} onChange={update} placeholder="Apellidos" className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
              <input required type="email" name="correo" value={form.correo} onChange={update} placeholder="Correo" className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
              <input name="telefono" value={form.telefono} onChange={update} placeholder="Telefono" className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
              <input name="direccion" value={form.direccion} onChange={update} placeholder="Direccion" className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 md:col-span-2" />
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold">Estancia</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <input required type="date" name="fechaInicio" value={form.fechaInicio} onChange={update} className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
              <input required type="date" name="fechaFin" value={form.fechaFin} onChange={update} className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
              {!selectedRoom && (
                <>
                  <input required name="idHabitacion" value={manualRoom.idHabitacion} onChange={updateRoom} placeholder="ID habitacion" className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
                  <input required name="idSucursal" value={manualRoom.idSucursal} onChange={updateRoom} placeholder="ID sucursal" className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
                  <input required name="precioBase" value={manualRoom.precioBase} onChange={updateRoom} placeholder="Precio por noche" type="number" step="0.01" className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
                </>
              )}
              <textarea name="observaciones" value={form.observaciones} onChange={update} placeholder="Observaciones" rows="3" className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 md:col-span-2" />
            </div>
          </section>

          {status.message && (
            <div className={['rounded-md px-4 py-3 text-sm', status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'].join(' ')}>
              {status.message}
            </div>
          )}

          <button disabled={saving} className="rounded-md bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60">
            {saving ? 'Enviando...' : 'Enviar reserva'}
          </button>
        </form>

        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Resumen</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p><span className="text-slate-500">Habitacion:</span> {getRoomTitle(room)}</p>
            <p><span className="text-slate-500">Precio noche:</span> ${getRoomPrice(room).toFixed(2)}</p>
            <p><span className="text-slate-500">Noches:</span> {totals.nights}</p>
            <p><span className="text-slate-500">Subtotal:</span> ${totals.subtotal.toFixed(2)}</p>
            <p><span className="text-slate-500">IVA 12%:</span> ${totals.iva.toFixed(2)}</p>
            <p className="border-t border-slate-200 pt-3 text-lg font-bold dark:border-slate-800">Total: ${totals.total.toFixed(2)}</p>
          </div>
          {!selectedRoom && (
            <Link to="/habitaciones" className="mt-5 block text-sm font-semibold text-indigo-600">
              Elegir desde el catalogo
            </Link>
          )}
        </aside>
      </div>
    </main>
  )
}
