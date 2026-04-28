export const lowerFirst = (value) => value ? value.charAt(0).toLowerCase() + value.slice(1) : value

const FIELD_LABELS = {
  activo: 'Activo',
  accion: 'Accion',
  aceptaNinos: 'Acepta ninos',
  aplicaIva: 'Aplica IVA',
  apellidos: 'Apellidos',
  areaM2: 'Area (m2)',
  canalTarifa: 'Canal',
  capacidadAdultos: 'Adultos',
  capacidadHabitacion: 'Capacidad',
  capacidadNinos: 'Ninos',
  capacidadTotal: 'Capacidad total',
  categoriaCatalogo: 'Categoria',
  categoriaViaje: 'Categoria de viaje',
  checkinAnticipado: 'Check-in anticipado',
  checkinUtc: 'Check-in',
  checkoutTardio: 'Check-out tardio',
  checkoutUtc: 'Check-out',
  ciudad: 'Ciudad',
  codigoAutorizacion: 'Codigo de autorizacion',
  codigoCatalogo: 'Codigo',
  codigoPostal: 'Codigo postal',
  codigoSucursal: 'Codigo',
  codigoTarifa: 'Codigo',
  codigoTipoHabitacion: 'Codigo',
  correo: 'Correo',
  descripcion: 'Descripcion',
  descripcionCatalogo: 'Descripcion',
  descripcionCorta: 'Descripcion corta',
  descripcionHabitacion: 'Descripcion',
  descripcionRol: 'Descripcion',
  descripcionSucursal: 'Descripcion',
  descuentoAplicado: 'Descuento aplicado',
  direccion: 'Direccion',
  disponible24h: 'Disponible 24h',
  edadMinimaHuesped: 'Edad minima',
  esPagoElectronico: 'Pago electronico',
  esWalkin: 'Walk-in',
  estado: 'Estado',
  estadoCatalogo: 'Estado',
  estadoEstadia: 'Estado',
  estadoHabitacion: 'Estado',
  estadoPago: 'Estado',
  estadoReserva: 'Estado',
  estadoRol: 'Estado',
  estadoSucursal: 'Estado',
  estadoTarifa: 'Estado',
  estadoTipoHabitacion: 'Estado',
  estadoUsuario: 'Estado',
  estadoValoracion: 'Estado',
  estrellas: 'Estrellas',
  fechaFin: 'Fecha fin',
  fechaInicio: 'Fecha inicio',
  fechaUtc: 'Fecha',
  horaCheckin: 'Hora check-in',
  horaCheckout: 'Hora check-out',
  horaFin: 'Hora fin',
  horaInicio: 'Hora inicio',
  iconoUrl: 'Icono URL',
  imagenUrl: 'Imagen',
  url: 'Imagen',
  idCliente: 'Cliente',
  idFactura: 'Factura',
  idHabitacion: 'Habitacion',
  habitaciones: 'Habitaciones',
  idReserva: 'Reserva',
  idRol: 'Rol',
  idSucursal: 'Sucursal',
  idTipoHabitacion: 'Tipo de habitacion',
  latitud: 'Latitud',
  longitud: 'Longitud',
  maxNoches: 'Maximo de noches',
  metodoPago: 'Metodo de pago',
  minNoches: 'Minimo de noches',
  moneda: 'Moneda',
  monto: 'Monto',
  nombreCatalogo: 'Nombre',
  nombreRol: 'Rol',
  nombreSucursal: 'Sucursal',
  nombreTarifa: 'Tarifa',
  nombreTipoHabitacion: 'Tipo de habitacion',
  nombres: 'Nombres',
  numeroFactura: 'Factura',
  numeroHabitacion: 'Habitacion',
  numeroIdentificacion: 'Identificacion',
  observaciones: 'Observaciones',
  origenCanalReserva: 'Origen de reserva',
  pais: 'Pais',
  permiteEventos: 'Permite eventos',
  permiteMascotas: 'Permite mascotas',
  permitePortalPublico: 'Visible en portal',
  permiteReservaPublica: 'Reserva publica',
  piso: 'Piso',
  precioBase: 'Precio base',
  precioPorNoche: 'Precio por noche',
  prioridad: 'Prioridad',
  proveedorPasarela: 'Proveedor',
  provincia: 'Provincia',
  puntuacionLimpieza: 'Limpieza',
  razonSocial: 'Razon social',
  referencia: 'Referencia',
  respuestaPasarela: 'Respuesta pasarela',
  roles: 'Roles',
  saldoPendiente: 'Saldo pendiente',
  sePermiteFumar: 'Permite fumar',
  subtotalReserva: 'Subtotal',
  tabla: 'Tabla',
  telefono: 'Telefono',
  tipoAlojamiento: 'Tipo de alojamiento',
  tipoCambio: 'Tipo de cambio',
  tipoCama: 'Tipo de cama',
  tipoCatalogo: 'Tipo',
  tipoIdentificacion: 'Tipo de identificacion',
  total: 'Total',
  totalReserva: 'Total reserva',
  transaccionExterna: 'Transaccion externa',
  ubicacion: 'Ubicacion',
  usuario: 'Usuario',
  username: 'Usuario',
  valorIva: 'IVA',
  porcentajeIva: 'IVA (%)',
}

const ACTION_LABELS = {
  confirmarReserva: 'Confirmar',
  cancelarReserva: 'Cancelar',
  checkout: 'Check-out',
  anularFactura: 'Anular',
  moderarValoracion: 'Moderar',
  responderValoracion: 'Responder',
  ejecutarPago: 'Pagar',
}

const humanizeKey = (value = '') =>
  value
    .replace(/^id(?=[A-Z])/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase())

export const getFieldLabel = (fieldOrName) => {
  const name = typeof fieldOrName === 'string' ? fieldOrName : fieldOrName?.label || fieldOrName?.name
  if (!name) return ''
  return FIELD_LABELS[name] || humanizeKey(name)
}

export const getActionLabel = (action) => ACTION_LABELS[action] || humanizeKey(action)

export const readValue = (row, key) => {
  if (!row || !key) return ''
  if (key === 'imagenUrl') return row.imagenUrl ?? row.ImagenUrl ?? row.url ?? row.Url ?? ''
  if (key === 'url') return row.url ?? row.Url ?? row.imagenUrl ?? row.ImagenUrl ?? ''
  return row[key] ?? row[lowerFirst(key)] ?? row[key.charAt(0).toUpperCase() + key.slice(1)] ?? ''
}

export const getOptionValue = (option) => typeof option === 'object' ? option.value : option

export const getOptionLabel = (option) => typeof option === 'object' ? option.label : option

export const getFieldValueLabel = (field, value) => {
  if (!field?.options) return value
  const option = field.options.find((item) => String(getOptionValue(item)) === String(value))
  return option ? getOptionLabel(option) : value
}

export const isStatusField = (fieldName = '') => {
  const normalized = String(fieldName).toLowerCase()
  return normalized === 'activo' || normalized === 'estado' || normalized.startsWith('estado')
}

export const getStatusTone = (value, label = '') => {
  const normalizedValue = String(value ?? '').trim().toUpperCase()
  const normalizedLabel = String(label ?? '').trim().toLowerCase()
  const key = normalizedValue || normalizedLabel

  if (['ACT', 'APR', 'CON', 'DIS', 'FIN', 'PAG', 'PUB', 'TRUE'].includes(key)) return 'success'
  if (['PEN', 'PRO', 'MNT', 'EMI'].includes(key)) return 'warning'
  if (['CAN', 'EXP', 'FDS', 'INA', 'REC', 'ANU', 'BLO', 'FALSE'].includes(key)) return 'danger'
  if (['OCU', 'REP'].includes(key)) return 'info'

  if (['activo', 'activa', 'aprobado', 'confirmada', 'disponible', 'finalizada', 'pagada', 'publicada'].includes(normalizedLabel)) return 'success'
  if (['pendiente', 'procesando', 'mantenimiento', 'emitida', 'en marcha'].includes(normalizedLabel)) return 'warning'
  if (['cancelada', 'cancelado', 'expirada', 'fuera de servicio', 'inactivo', 'inactiva', 'rechazado', 'anulada', 'bloqueado'].includes(normalizedLabel)) return 'danger'
  if (['ocupada', 'oculta', 'reportada'].includes(normalizedLabel)) return 'info'

  return 'neutral'
}

export const resolveId = (row, module) => {
  for (const key of module.idKeys || []) {
    const value = row?.[key] ?? row?.[lowerFirst(key)]
    if (value !== undefined && value !== null) return value
  }
  return row?.id ?? row?.Id
}

export const buildInitialForm = (module) => {
  const values = {}
  for (const field of module.fields || []) {
    values[field.name] = field.defaultValue ?? ''
  }
  for (const [key, value] of Object.entries(module.defaults || {})) {
    values[key] = typeof value === 'function' ? value() : value
  }
  return values
}

export const buildFormFromRow = (module, row) => {
  const values = buildInitialForm(module)
  for (const field of module.fields || []) {
    const value = readValue(row, field.name)
    values[field.name] = field.type === 'date' && value
      ? String(value).slice(0, 10)
      : field.name === 'roles' && Array.isArray(value)
      ? value.map((role) => role.idRol ?? role.IdRol).filter(Boolean).join(',')
      : value
  }
  return values
}

const toIsoDateTime = (value) => {
  if (!value) return value
  return new Date(`${value}T12:00:00`).toISOString()
}

const pickPayloadFields = (payload, fields) => {
  if (!fields) return payload
  return fields.reduce((next, key) => {
    if (payload[key] !== undefined) next[key] = payload[key]
    return next
  }, {})
}

export const coercePayload = (values, module, mode) => {
  const payload = { ...values }
  for (const field of module.fields || []) {
    if (field.type === 'checkbox') payload[field.name] = Boolean(payload[field.name])
    if (field.type === 'number' || field.type === 'relation') payload[field.name] = payload[field.name] === '' ? null : Number(payload[field.name])
    if (field.type === 'date') payload[field.name] = toIsoDateTime(payload[field.name])
  }
  for (const [key, value] of Object.entries(module.defaults || {})) {
    payload[key] = typeof value === 'function' ? value() : value
  }
  const transformed = module.transformPayload ? module.transformPayload(payload, mode) : payload
  const allowedFields = mode === 'update' ? module.updatePayloadFields : module.createPayloadFields
  return pickPayloadFields(transformed, allowedFields || module.payloadFields)
}
