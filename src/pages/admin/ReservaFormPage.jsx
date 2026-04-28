import { useEffect, useMemo, useReducer, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { adminApi } from '../../api/adminApi'
import { ENDPOINTS } from '../../api/endpoints'
import { IVA_RATE, getNights } from '../../api/reservasApi'
import { showError, showSuccess } from '../../utils/sweetAlert'

// ─── Estado inicial del formulario ───────────────────────────────────────────
const INITIAL_FORM = {
  idCliente: '',
  idSucursal: '',
  fechaInicio: '',
  fechaFin: '',
  descuentoAplicado: 0,
  origenCanalReserva: 'ADMIN',
  estadoReserva: 'PEN',
  observaciones: '',
  esWalkin: false,
}

// ─── Reducer para el formulario ───────────────────────────────────────────────
function formReducer(state, { field, value, values }) {
  if (values) return { ...state, ...values }
  return { ...state, [field]: value }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toIsoDateTime = (localStr) => {
  if (!localStr) return null
  // localStr viene de datetime-local: "2026-04-26T14:00"
  return new Date(localStr).toISOString()
}

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(value ?? 0)

const readValue = (source, keys, fallback = '') => {
  for (const key of keys) {
    const value = source?.[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return fallback
}

const asArray = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.$values)) return value.$values
  return []
}

const toLocalDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

// ─── Construcción del payload final ──────────────────────────────────────────
const buildReservaPayload = ({ form, habitaciones, servicios, totals }) => ({
  idCliente: Number(form.idCliente),
  idSucursal: Number(form.idSucursal),
  fechaInicio: toIsoDateTime(form.fechaInicio),
  fechaFin: toIsoDateTime(form.fechaFin),
  subtotalReserva: totals.subtotal,
  valorIva: totals.iva,
  totalReserva: totals.total,
  descuentoAplicado: Number(form.descuentoAplicado) || 0,
  saldoPendiente: totals.pending,
  origenCanalReserva: form.origenCanalReserva,
  estadoReserva: form.estadoReserva,
  observaciones: form.observaciones || '',
  esWalkin: Boolean(form.esWalkin),
  // El backend solo quiere [{ idHabitacion: X }]
  habitaciones: habitaciones.map((h) => ({ idHabitacion: h.idHabitacion })),
  ...(servicios.length > 0
    ? {
        serviciosAdicionales: servicios.map((servicio) => ({
          idCatalogo: Number(servicio.idCatalogo),
          cantidad: Number(servicio.cantidad) || 1,
          precioUnitario: Number(servicio.precioBase) || 0,
        })),
      }
    : {}),
})

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function ReservaFormPage() {
  const navigate = useNavigate()
  const { recordId } = useParams()
  const isEdit = Boolean(recordId)

  // Estado de formulario (cabecera)
  const [form, dispatch] = useReducer(formReducer, INITIAL_FORM)

  // Habitaciones seleccionadas (cada item: { idHabitacion, label, precioBase })
  const [habitaciones, setHabitaciones] = useState([])
  const [servicios, setServicios] = useState([])

  // Datos de relaciones para los selects
  const [clientes, setClientes] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([])
  const [serviciosDisponibles, setServiciosDisponibles] = useState([])
  const [loadingRelations, setLoadingRelations] = useState(true)
  const [loadingReserva, setLoadingReserva] = useState(isEdit)

  // UI
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const getHabitacionOption = (id) => {
    const numericId = Number(id)
    return habitacionesDisponibles.find(
      (h) => Number(readValue(h, ['idHabitacion', 'IdHabitacion', 'id'])) === numericId
    )
  }

  const buildHabitacionItem = (source) => {
    const idHabitacion = Number(readValue(source, ['idHabitacion', 'IdHabitacion', 'id']))
    const catalogItem = getHabitacionOption(idHabitacion)
    const merged = catalogItem || source
    const numeroHabitacion = readValue(merged, ['numeroHabitacion', 'NumeroHabitacion'], `Hab ${idHabitacion}`)
    const precioBase = Number(readValue(source, ['precioBase', 'PrecioBase', 'precioNocheAplicado', 'PrecioNocheAplicado'], readValue(merged, ['precioBase', 'PrecioBase'], 0)))
    const sucursalId = readValue(merged, ['idSucursal', 'IdSucursal'], '')

    return {
      idHabitacion,
      label: `${numeroHabitacion} — $${precioBase}/noche`,
      precioBase,
      sucursalId,
    }
  }

  const buildServicioItem = (source) => {
    const idCatalogo = Number(readValue(source, ['idCatalogo', 'IdCatalogo', 'idServicio', 'IdServicio', 'id']))
    const catalogItem = serviciosDisponibles.find((item) => Number(readValue(item, ['idCatalogo', 'IdCatalogo', 'id'])) === idCatalogo)
    const merged = catalogItem || source
    const nombre = readValue(merged, ['nombreCatalogo', 'NombreCatalogo', 'nombreServicio', 'NombreServicio'], `Servicio #${idCatalogo}`)
    const precioBase = Number(readValue(source, ['precioBase', 'PrecioBase', 'precioUnitario', 'PrecioUnitario'], readValue(merged, ['precioBase', 'PrecioBase'], 0)))
    const cantidad = Number(readValue(source, ['cantidad', 'Cantidad'], 1)) || 1
    const aplicaIva = Boolean(readValue(merged, ['aplicaIva', 'AplicaIva'], true))

    return { idCatalogo, nombre, precioBase, cantidad, aplicaIva }
  }

  const hydrateReserva = (reserva) => {
    if (!reserva) return

    dispatch({
      values: {
        idCliente: String(readValue(reserva, ['idCliente', 'IdCliente'], '')),
        idSucursal: String(readValue(reserva, ['idSucursal', 'IdSucursal'], '')),
        fechaInicio: toLocalDateTime(readValue(reserva, ['fechaInicio', 'FechaInicio'])),
        fechaFin: toLocalDateTime(readValue(reserva, ['fechaFin', 'FechaFin'])),
        descuentoAplicado: Number(readValue(reserva, ['descuentoAplicado', 'DescuentoAplicado'], 0)),
        origenCanalReserva: readValue(reserva, ['origenCanalReserva', 'OrigenCanalReserva'], 'ADMIN'),
        estadoReserva: readValue(reserva, ['estadoReserva', 'EstadoReserva'], 'PEN'),
        observaciones: readValue(reserva, ['observaciones', 'Observaciones'], ''),
        esWalkin: Boolean(readValue(reserva, ['esWalkin', 'EsWalkin'], false)),
      },
    })

    const rawHabitaciones = asArray(reserva.habitaciones ?? reserva.Habitaciones ?? reserva.detalles ?? reserva.Detalles)
    setHabitaciones(rawHabitaciones.map(buildHabitacionItem).filter((item) => item.idHabitacion))

    const rawServicios = asArray(reserva.serviciosAdicionales ?? reserva.ServiciosAdicionales ?? reserva.servicios ?? reserva.Servicios)
    setServicios(rawServicios.map(buildServicioItem).filter((item) => item.idCatalogo))
  }

  // ── Carga inicial de relaciones ──────────────────────────────────────────
  useEffect(() => {
    let alive = true
    Promise.all([
      adminApi.list(ENDPOINTS.INTERNAL.CLIENTES),
      adminApi.list(ENDPOINTS.INTERNAL.SUCURSALES),
      adminApi.list(ENDPOINTS.INTERNAL.HABITACIONES),
      adminApi.list(ENDPOINTS.INTERNAL.CATALOGO_SERVICIOS),
    ])
      .then(([cls, sucs, habs, srvs]) => {
        if (!alive) return
        setClientes(cls)
        setSucursales(sucs)
        setHabitacionesDisponibles(habs)
        setServiciosDisponibles(srvs.filter((item) => readValue(item, ['estadoCatalogo', 'EstadoCatalogo'], 'ACT') !== 'INA'))
      })
      .catch(() => {
        if (alive) setError('No se pudieron cargar los datos del formulario.')
      })
      .finally(() => {
        if (alive) setLoadingRelations(false)
      })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!isEdit || loadingRelations) {
      return
    }

    let alive = true

    adminApi.get(ENDPOINTS.INTERNAL.RESERVAS, recordId)
      .then((reserva) => {
        if (alive) hydrateReserva(reserva)
      })
      .catch(() => {
        if (alive) setError('No se pudo cargar la reserva para editar.')
      })
      .finally(() => {
        if (alive) setLoadingReserva(false)
      })

    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, loadingRelations, recordId])

  // ── Cálculo automático (useMemo) ─────────────────────────────────────────
  const totals = useMemo(() => {
    const noches = getNights(
      form.fechaInicio ? form.fechaInicio.slice(0, 10) : '',
      form.fechaFin ? form.fechaFin.slice(0, 10) : '',
    )
    const habitacionesSubtotal = Number(
      habitaciones.reduce((acc, h) => acc + (Number(h.precioBase) || 0) * noches, 0).toFixed(2)
    )
    const serviciosSubtotal = Number(
      servicios.reduce((acc, servicio) => acc + (Number(servicio.precioBase) || 0) * (Number(servicio.cantidad) || 1), 0).toFixed(2)
    )
    const serviciosConIva = Number(
      servicios
        .filter((servicio) => servicio.aplicaIva)
        .reduce((acc, servicio) => acc + (Number(servicio.precioBase) || 0) * (Number(servicio.cantidad) || 1), 0)
        .toFixed(2)
    )
    const subtotal = Number((habitacionesSubtotal + serviciosSubtotal).toFixed(2))
    const descuento = Math.min(Number(form.descuentoAplicado) || 0, subtotal)
    const base = subtotal - descuento
    const taxableBase = Math.max(habitacionesSubtotal + serviciosConIva - descuento, 0)
    const iva = Number((taxableBase * IVA_RATE).toFixed(2))
    const total = Number((base + iva).toFixed(2))
    return { noches, habitacionesSubtotal, serviciosSubtotal, subtotal, descuento, iva, total, pending: total }
  }, [form.fechaInicio, form.fechaFin, form.descuentoAplicado, habitaciones, servicios])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleField = (e) => {
    const { name, value, type, checked } = e.target
    dispatch({ field: name, value: type === 'checkbox' ? checked : value })
  }

  const handleAddHabitacion = (e) => {
    const id = Number(e.target.value)
    e.target.value = ''
    if (!id) return

    if (habitaciones.some((h) => h.idHabitacion === id)) return // ya está

    const found = habitacionesDisponibles.find(
      (h) => (h.idHabitacion ?? h.IdHabitacion ?? h.id) === id
    )
    if (!found) return

    const idHabitacion = found.idHabitacion ?? found.IdHabitacion ?? found.id
    const numeroHabitacion = found.numeroHabitacion ?? found.NumeroHabitacion ?? `Hab ${id}`
    const precioBase = found.precioBase ?? found.PrecioBase ?? 0
    const sucursalId = found.idSucursal ?? found.IdSucursal ?? ''

    setHabitaciones((prev) => [
      ...prev,
      { idHabitacion, label: `${numeroHabitacion} — $${precioBase}/noche`, precioBase, sucursalId },
    ])
  }

  const handleRemoveHabitacion = (id) =>
    setHabitaciones((prev) => prev.filter((h) => h.idHabitacion !== id))

  const handleAddServicio = (e) => {
    const id = Number(e.target.value)
    e.target.value = ''
    if (!id) return

    const found = serviciosDisponibles.find(
      (servicio) => Number(readValue(servicio, ['idCatalogo', 'IdCatalogo', 'id'])) === id
    )
    if (!found) return

    setServicios((prev) => {
      const existing = prev.find((servicio) => servicio.idCatalogo === id)
      if (existing) {
        return prev.map((servicio) =>
          servicio.idCatalogo === id
            ? { ...servicio, cantidad: Number(servicio.cantidad) + 1 }
            : servicio
        )
      }
      return [...prev, buildServicioItem(found)]
    })
  }

  const handleServicioCantidad = (id, cantidad) => {
    const nextCantidad = Math.max(Number(cantidad) || 1, 1)
    setServicios((prev) =>
      prev.map((servicio) =>
        servicio.idCatalogo === id ? { ...servicio, cantidad: nextCantidad } : servicio
      )
    )
  }

  const handleRemoveServicio = (id) =>
    setServicios((prev) => prev.filter((servicio) => servicio.idCatalogo !== id))

  // ── Envío al backend ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validaciones
    if (!form.idCliente) return setError('Seleccione un cliente.')
    if (!form.idSucursal) return setError('Seleccione una sucursal.')
    if (!form.fechaInicio || !form.fechaFin) return setError('Indique las fechas de inicio y fin.')
    if (new Date(form.fechaInicio) >= new Date(form.fechaFin))
      return setError('La fecha de inicio debe ser anterior a la de fin.')
    if (habitaciones.length === 0)
      return setError('Agregue al menos una habitación a la reserva.')

    const payload = buildReservaPayload({ form, habitaciones, servicios, totals })
    console.log('[ReservaFormPage] payload →', JSON.stringify(payload, null, 2))

    setSaving(true)
    try {
      if (isEdit) await adminApi.update(ENDPOINTS.INTERNAL.RESERVAS, recordId, payload)
      else await adminApi.create(ENDPOINTS.INTERNAL.RESERVAS, payload)
      await showSuccess(
        isEdit ? 'Reserva actualizada' : 'Reserva creada',
        isEdit ? 'Los cambios de la reserva se guardaron correctamente.' : 'La reserva se guardó correctamente.',
      )
      navigate('/admin/reservas', { replace: true })
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.title ||
        'No se pudo guardar la reserva.'
      setError(msg)
      await showError('Error al guardar', msg)
    } finally {
      setSaving(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Formulario</p>
          <h1 className="mt-2 text-3xl font-bold">{isEdit ? `Editar Reserva #${recordId}` : 'Crear Reserva'}</h1>
        </div>
        <Link
          to="/admin/reservas"
          className="inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          Volver
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {loadingRelations || loadingReserva ? (
        <div className="rounded-lg bg-white p-8 text-center text-slate-500 dark:bg-slate-900">
          {loadingReserva ? 'Cargando reserva…' : 'Cargando datos del formulario…'}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Sección 1: Datos principales ─────────────────────────────── */}
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-base font-semibold text-slate-700 dark:text-slate-200">
              Datos principales
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

              {/* Cliente */}
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Cliente <span className="text-red-500">*</span></span>
                <select
                  name="idCliente"
                  required
                  value={form.idCliente}
                  onChange={handleField}
                  className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="">Selecciona un cliente…</option>
                  {clientes.map((c) => {
                    const id = c.idCliente ?? c.IdCliente ?? c.id
                    const label = [c.nombres, c.apellidos, c.numeroIdentificacion].filter(Boolean).join(' — ')
                    return <option key={id} value={id}>{label || `Cliente #${id}`}</option>
                  })}
                </select>
              </label>

              {/* Sucursal */}
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Sucursal <span className="text-red-500">*</span></span>
                <select
                  name="idSucursal"
                  required
                  value={form.idSucursal}
                  onChange={handleField}
                  className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="">Selecciona una sucursal…</option>
                  {sucursales.map((s) => {
                    const id = s.idSucursal ?? s.IdSucursal ?? s.id
                    return <option key={id} value={id}>{s.nombreSucursal ?? s.codigoSucursal ?? `Sucursal #${id}`}</option>
                  })}
                </select>
              </label>

              {/* Origen canal */}
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Origen / Canal</span>
                <select
                  name="origenCanalReserva"
                  value={form.origenCanalReserva}
                  onChange={handleField}
                  className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="ADMIN">Panel Administrativo</option>
                  <option value="WEB">Web</option>
                  <option value="PHONE">Teléfono</option>
                  <option value="API">API</option>
                  <option value="WALKIN">Walk-in</option>
                </select>
              </label>

              {/* Estado reserva */}
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Estado</span>
                <select
                  name="estadoReserva"
                  value={form.estadoReserva}
                  onChange={handleField}
                  className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="PEN">Pendiente</option>
                  <option value="CON">Confirmada</option>
                  <option value="CAN">Cancelada</option>
                  <option value="EXP">Expirada</option>
                  <option value="FIN">Finalizada</option>
                  <option value="EMI">En marcha</option>
                </select>
              </label>

              {/* Fecha inicio */}
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Fecha inicio <span className="text-red-500">*</span></span>
                <input
                  type="datetime-local"
                  name="fechaInicio"
                  required
                  value={form.fechaInicio}
                  onChange={handleField}
                  className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>

              {/* Fecha fin */}
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Fecha fin <span className="text-red-500">*</span></span>
                <input
                  type="datetime-local"
                  name="fechaFin"
                  required
                  value={form.fechaFin}
                  onChange={handleField}
                  className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>

              {/* Observaciones */}
              <label className="flex flex-col gap-1 text-sm md:col-span-2">
                <span className="font-medium">Observaciones</span>
                <textarea
                  name="observaciones"
                  rows={2}
                  value={form.observaciones}
                  onChange={handleField}
                  className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>

              {/* Walk-in */}
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  name="esWalkin"
                  checked={form.esWalkin}
                  onChange={handleField}
                  className="h-5 w-5 rounded"
                />
                Walk-in (sin reserva previa)
              </label>
            </div>
          </section>

          {/* ── Sección 2: Habitaciones ───────────────────────────────────── */}
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-base font-semibold text-slate-700 dark:text-slate-200">
              Habitaciones seleccionadas
              {habitaciones.length > 0 && (
                <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                  {habitaciones.length}
                </span>
              )}
            </h2>

            {/* Selector para agregar */}
            <select
              defaultValue=""
              onChange={handleAddHabitacion}
              className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="" disabled>+ Agregar habitación…</option>
              {habitacionesDisponibles
                .filter((h) => {
                  const id = h.idHabitacion ?? h.IdHabitacion ?? h.id
                  return !habitaciones.some((sel) => sel.idHabitacion === id)
                })
                .map((h) => {
                  const id = h.idHabitacion ?? h.IdHabitacion ?? h.id
                  const num = h.numeroHabitacion ?? h.NumeroHabitacion ?? `#${id}`
                  const precio = h.precioBase ?? h.PrecioBase ?? 0
                  return (
                    <option key={id} value={id}>
                      {num} — ${precio}/noche
                    </option>
                  )
                })}
            </select>

            {/* Lista de habitaciones seleccionadas */}
            {habitaciones.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 py-6 text-center text-sm text-slate-400 dark:border-slate-700">
                Ninguna habitación agregada aún.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-md border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
                {habitaciones.map((h) => (
                  <li key={h.idHabitacion} className="flex items-center justify-between px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{h.label}</span>
                      <span className="text-xs text-slate-500">
                        {totals.noches} noche{totals.noches !== 1 ? 's' : ''} →{' '}
                        {formatCurrency(Number(h.precioBase) * totals.noches)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveHabitacion(h.idHabitacion)}
                      className="ml-4 rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ── Sección 3: Servicios adicionales ───────────────────────────── */}
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-base font-semibold text-slate-700 dark:text-slate-200">
              Servicios adicionales
              {servicios.length > 0 && (
                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                  {servicios.length}
                </span>
              )}
            </h2>

            <select
              defaultValue=""
              onChange={handleAddServicio}
              className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="" disabled>+ Agregar servicio…</option>
              {serviciosDisponibles.map((servicio) => {
                const id = readValue(servicio, ['idCatalogo', 'IdCatalogo', 'id'])
                const nombre = readValue(servicio, ['nombreCatalogo', 'NombreCatalogo'], `Servicio #${id}`)
                const precio = Number(readValue(servicio, ['precioBase', 'PrecioBase'], 0))
                return (
                  <option key={id} value={id}>
                    {nombre} — {formatCurrency(precio)}
                  </option>
                )
              })}
            </select>

            {servicios.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 py-6 text-center text-sm text-slate-400 dark:border-slate-700">
                Ningún servicio adicional agregado.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-md border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
                {servicios.map((servicio) => {
                  const subtotalServicio = (Number(servicio.precioBase) || 0) * (Number(servicio.cantidad) || 1)
                  return (
                    <li key={servicio.idCatalogo} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{servicio.nombre}</span>
                        <span className="text-xs text-slate-500">
                          {formatCurrency(servicio.precioBase)} x {servicio.cantidad} = {formatCurrency(subtotalServicio)}
                          {servicio.aplicaIva ? ' + IVA' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={servicio.cantidad}
                          onChange={(event) => handleServicioCantidad(servicio.idCatalogo, event.target.value)}
                          className="w-20 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                          aria-label={`Cantidad de ${servicio.nombre}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveServicio(servicio.idCatalogo)}
                          className="rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          Quitar
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {/* ── Sección 3: Totales ────────────────────────────────────────── */}
          <section className="rounded-lg border border-indigo-100 bg-indigo-50 p-5 shadow-sm dark:border-indigo-900 dark:bg-indigo-950/30">
            <h2 className="mb-4 text-base font-semibold text-indigo-800 dark:text-indigo-300">
              Resumen de costos
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {/* Descuento editable */}
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Descuento aplicado ($)
                </span>
                <input
                  type="number"
                  name="descuentoAplicado"
                  min={0}
                  step="0.01"
                  value={form.descuentoAplicado}
                  onChange={handleField}
                  className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>

              {/* Totales solo lectura */}
              <div className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-500 dark:text-slate-400">Noches</span>
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {totals.noches}
                </span>
              </div>

              <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Habitaciones</span>
                  <span className="font-semibold">{formatCurrency(totals.habitacionesSubtotal)}</span>
                </div>
                {totals.serviciosSubtotal > 0 && (
                  <div className="flex justify-between">
                    <span>Servicios</span>
                    <span className="font-semibold">{formatCurrency(totals.serviciosSubtotal)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.descuento > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Descuento</span>
                    <span className="font-semibold">- {formatCurrency(totals.descuento)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>IVA 12%</span>
                  <span className="font-semibold">{formatCurrency(totals.iva)}</span>
                </div>
              </div>

              <div className="flex flex-col items-end justify-center">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Total reserva
                </span>
                <span className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-300">
                  {formatCurrency(totals.total)}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Saldo pendiente: {formatCurrency(totals.pending)}
                </span>
              </div>
            </div>
          </section>

          {/* ── Botones ───────────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : isEdit ? 'Actualizar Reserva' : 'Crear Reserva'}
            </button>
            <Link
              to="/admin/reservas"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700"
            >
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
