import api from './axiosConfig'
import { ENDPOINTS } from './endpoints'
import { normalizeEntity } from './normalize'

export const IVA_RATE = 0.12

const toIsoDate = (value) => {
  if (!value) return ''
  return new Date(`${value}T12:00:00`).toISOString()
}

export const getNights = (startDate, endDate) => {
  if (!startDate || !endDate) return 1
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  const diff = Math.ceil((end - start) / 86400000)
  return Math.max(diff, 1)
}

export const buildReservationTotals = ({ startDate, endDate, price }) => {
  const nights = getNights(startDate, endDate)
  const subtotal = Number(price || 0) * nights
  const iva = Number((subtotal * IVA_RATE).toFixed(2))
  const total = Number((subtotal + iva).toFixed(2))
  return {
    nights,
    subtotal,
    iva,
    total,
    discount: 0,
    pending: total,
  }
}

export const buildClientePayload = (form) => ({
  tipoIdentificacion: form.tipoIdentificacion || 'CED',
  numeroIdentificacion: form.numeroIdentificacion,
  nombres: form.nombres,
  apellidos: form.apellidos,
  razonSocial: '',
  correo: form.correo,
  telefono: form.telefono,
  direccion: form.direccion || '',
  estado: 'ACT',
})

/**
 * Construye el payload para crear una reserva desde el flujo público
 * (una sola habitación, datos simples).
 * Para el flujo administrativo con múltiples habitaciones usa ReservaFormPage.
 */
export const buildReservaPayload = ({ clienteId, room, form, totals }) => ({
  idCliente: Number(clienteId),
  idSucursal: Number(room.idSucursal ?? room.IdSucursal ?? room.sucursalId ?? 1),
  fechaInicio: toIsoDate(form.fechaInicio),
  fechaFin: toIsoDate(form.fechaFin),
  subtotalReserva: totals.subtotal,
  valorIva: totals.iva,
  totalReserva: totals.total,
  descuentoAplicado: 0,
  saldoPendiente: totals.pending,
  origenCanalReserva: 'WEB',
  estadoReserva: 'PEN',
  observaciones: form.observaciones || '',
  esWalkin: false,
  // El backend espera estrictamente [{ idHabitacion: X }]
  habitaciones: [{ idHabitacion: Number(room.idHabitacion ?? room.IdHabitacion ?? room.id) }],
})

/**
 * Construye el payload para el flujo administrativo con múltiples habitaciones.
 * @param {{ form: object, habitaciones: Array<{idHabitacion: number, precioBase: number}>, totals: object }} params
 */
export const buildReservaAdminPayload = ({ form, habitaciones, totals }) => ({
  idCliente: Number(form.idCliente),
  idSucursal: Number(form.idSucursal),
  fechaInicio: form.fechaInicio ? new Date(form.fechaInicio).toISOString() : null,
  fechaFin: form.fechaFin ? new Date(form.fechaFin).toISOString() : null,
  subtotalReserva: totals.subtotal,
  valorIva: totals.iva,
  totalReserva: totals.total,
  descuentoAplicado: Number(form.descuentoAplicado) || 0,
  saldoPendiente: totals.pending,
  origenCanalReserva: form.origenCanalReserva || 'ADMIN',
  estadoReserva: form.estadoReserva || 'PEN',
  observaciones: form.observaciones || '',
  esWalkin: Boolean(form.esWalkin),
  habitaciones: habitaciones.map((h) => ({ idHabitacion: h.idHabitacion })),
})

export const reservasApi = {
  async createCliente(payload) {
    const { data } = await api.post(ENDPOINTS.INTERNAL.CLIENTES.base, payload)
    return normalizeEntity(data)
  },

  async createReserva(payload) {
    const { data } = await api.post(ENDPOINTS.INTERNAL.RESERVAS.base, payload)
    return normalizeEntity(data)
  },

  async confirmReserva(id) {
    await api.patch(ENDPOINTS.INTERNAL.RESERVAS.confirmar(id))
  },

  async cancelReserva(id, motivo) {
    await api.patch(ENDPOINTS.INTERNAL.RESERVAS.cancelar(id), { motivo })
  },
}
