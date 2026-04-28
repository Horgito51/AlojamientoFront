import { ENDPOINTS } from '../api/endpoints'

const active = { name: 'activo', type: 'checkbox', defaultValue: true }
const option = (value, label) => ({ value, label })
const select = (name, options, defaultValue = '', required = true) => ({ name, type: 'select', options, defaultValue, required })
const relation = (name, endpoint, valueKeys, labelKeys, required = true) => ({ name, type: 'relation', endpoint, valueKeys, labelKeys, required })
const relationMultiple = (name, endpoint, valueKeys, labelKeys, required = true) => ({ name, type: 'relation', endpoint, valueKeys, labelKeys, required, multiple: true })

const activeState = [
  option('ACT', 'Activo'),
  option('INA', 'Inactivo'),
]

const roomState = [
  option('DIS', 'Disponible'),
  option('OCU', 'Ocupada'),
  option('MNT', 'Mantenimiento'),
  option('FDS', 'Fuera de servicio'),
  option('INA', 'Inactiva'),
]

const bookingState = [
  option('PEN', 'Pendiente'),
  option('CON', 'Confirmada'),
  option('CAN', 'Cancelada'),
  option('EXP', 'Expirada'),
  option('FIN', 'Finalizada'),
  option('EMI', 'En marcha'),
]

const stayState = [
  option('ACT', 'Activa'),
  option('FIN', 'Finalizada'),
  option('CAN', 'Cancelada'),
]

const invoiceState = [
  option('EMI', 'Emitida'),
  option('PAG', 'Pagada'),
  option('ANU', 'Anulada'),
]

const paymentState = [
  option('PEN', 'Pendiente'),
  option('PRO', 'Procesando'),
  option('APR', 'Aprobado'),
  option('REC', 'Rechazado'),
  option('CAN', 'Cancelado'),
]

const reviewState = [
  option('PEN', 'Pendiente'),
  option('PUB', 'Publicada'),
  option('OCU', 'Oculta'),
  option('REP', 'Reportada'),
]

const userState = [
  option('ACT', 'Activo'),
  option('INA', 'Inactivo'),
  option('BLO', 'Bloqueado'),
]

const accommodationTypes = [
  option('hotel', 'Hotel'),
  option('hostal', 'Hostal'),
  option('apartamento', 'Apartamento'),
  option('resort', 'Resort'),
  option('villa', 'Villa'),
  option('cabana', 'Cabana'),
  option('hostel', 'Hostel'),
]

const tripCategories = [
  option('playa', 'Playa'),
  option('ciudad', 'Ciudad'),
  option('montana', 'Montana'),
  option('aventura', 'Aventura'),
  option('cultural', 'Cultural'),
  option('bienestar', 'Bienestar'),
]

const bedTypes = [
  option('individual', 'Individual'),
  option('matrimonial', 'Matrimonial'),
  option('queen', 'Queen'),
  option('king', 'King'),
  option('doble', 'Doble'),
  option('literas', 'Literas'),
  option('sofa-cama', 'Sofa cama'),
]

const catalogTypes = [
  option('AME', 'Amenidad incluida'),
  option('SRV', 'Servicio adicional'),
]

const catalogCategories = [
  option('habitacion', 'Habitacion'),
  option('alimentos', 'Alimentos y bebidas'),
  option('transporte', 'Transporte'),
  option('bienestar', 'Bienestar'),
  option('limpieza', 'Limpieza'),
  option('entretenimiento', 'Entretenimiento'),
]

const identificationTypes = [
  option('CED', 'Cedula'),
  option('RUC', 'RUC'),
  option('PAS', 'Pasaporte'),
]

const rateChannels = [
  option('TODOS', 'Todos los canales'),
  option('PORTAL', 'Portal publico'),
  option('ADMIN', 'Panel administrativo'),
  option('API', 'Integracion API'),
  option('WALKIN', 'Walk-in'),
]

const bookingOrigins = [
  option('WEB', 'Web'),
  option('ADMIN', 'Panel Administrativo'),
  option('API', 'API'),
  option('PHONE', 'Telefono'),
]

const paymentMethods = [
  option('EFECTIVO', 'Efectivo'),
  option('TARJETA', 'Tarjeta'),
  option('TRANSFERENCIA', 'Transferencia'),
  option('PAYPAL', 'PayPal'),
  option('PASARELA', 'Pasarela de pago'),
]

const currencies = [
  option('USD', 'Dolar estadounidense'),
]

export const adminNavigation = [
  { to: '/admin', label: 'Dashboard', group: 'Inicio' },
  { to: '/admin/sucursales', label: 'Sucursales', group: 'Alojamiento' },
  { to: '/admin/tipos-habitacion', label: 'Tipos', group: 'Alojamiento' },
  { to: '/admin/habitaciones', label: 'Habitaciones', group: 'Alojamiento' },
  { to: '/admin/tarifas', label: 'Tarifas', group: 'Alojamiento' },
  { to: '/admin/servicios', label: 'Servicios', group: 'Alojamiento' },
  { to: '/admin/clientes', label: 'Clientes', group: 'Reservas' },
  { to: '/admin/reservas', label: 'Reservas', group: 'Reservas' },
  { to: '/admin/estadias', label: 'Estadias', group: 'Hospedaje' },
  { to: '/admin/facturas', label: 'Facturas', group: 'Facturacion' },
  { to: '/admin/pagos', label: 'Pagos', group: 'Facturacion' },
  { to: '/admin/usuarios', label: 'Usuarios', group: 'Seguridad' },
  { to: '/admin/roles', label: 'Roles', group: 'Seguridad' },
  { to: '/admin/auditoria', label: 'Auditoria', group: 'Seguridad' },
  { to: '/admin/valoraciones', label: 'Valoraciones', group: 'Experiencia' },
]

const text = (name, required = true) => ({ name, type: 'text', required })
const number = (name, required = true) => ({ name, type: 'number', required })
const money = (name) => ({ name, type: 'number', step: '0.01', required: true })
const date = (name) => ({ name, type: 'date', required: true })
const checkbox = (name, defaultValue = false) => ({ name, type: 'checkbox', defaultValue })

export const adminModules = {
  sucursales: {
    title: 'Sucursales',
    endpoint: ENDPOINTS.INTERNAL.SUCURSALES,
    idKeys: ['idSucursal', 'IdSucursal'],
    columns: ['codigoSucursal', 'nombreSucursal', 'ciudad', 'telefono', 'estadoSucursal'],
    fields: [
      text('codigoSucursal'),
      text('nombreSucursal'),
      text('descripcionSucursal', false),
      text('descripcionCorta', false),
      select('tipoAlojamiento', accommodationTypes, 'hotel', false),
      number('estrellas', false),
      select('categoriaViaje', tripCategories, '', false),
      text('pais', false),
      text('provincia', false),
      text('ciudad', false),
      text('ubicacion', false),
      text('direccion', false),
      text('codigoPostal', false),
      text('telefono', false),
      text('correo', false),
      number('latitud', false),
      number('longitud', false),
      text('horaCheckin', false),
      text('horaCheckout', false),
      checkbox('checkinAnticipado'),
      checkbox('checkoutTardio'),
      checkbox('aceptaNinos', true),
      number('edadMinimaHuesped', false),
      checkbox('permiteMascotas'),
      checkbox('sePermiteFumar'),
      select('estadoSucursal', activeState, 'ACT'),
    ],
  },
  'tipos-habitacion': {
    title: 'Tipos de habitacion',
    endpoint: ENDPOINTS.INTERNAL.TIPOS_HABITACION,
    idKeys: ['idTipoHabitacion', 'IdTipoHabitacion'],
    columns: ['codigoTipoHabitacion', 'nombreTipoHabitacion', 'capacidadTotal', 'tipoCama', 'estadoTipoHabitacion'],
    fields: [
      text('codigoTipoHabitacion'),
      text('nombreTipoHabitacion'),
      text('descripcion', false),
      number('capacidadAdultos'),
      number('capacidadNinos'),
      number('capacidadTotal'),
      select('tipoCama', bedTypes, '', false),
      money('areaM2'),
      checkbox('permiteEventos'),
      checkbox('permiteReservaPublica', true),
      select('estadoTipoHabitacion', activeState, 'ACT'),
    ],
  },
  habitaciones: {
    title: 'Habitaciones',
    endpoint: ENDPOINTS.INTERNAL.HABITACIONES,
    idKeys: ['idHabitacion', 'IdHabitacion'],
    columns: ['numeroHabitacion', 'idSucursal', 'idTipoHabitacion', 'precioBase', 'estadoHabitacion', 'imagenUrl'],
    fields: [
      relation('idSucursal', ENDPOINTS.INTERNAL.SUCURSALES, ['idSucursal', 'IdSucursal', 'id'], ['nombreSucursal', 'codigoSucursal']),
      relation('idTipoHabitacion', ENDPOINTS.INTERNAL.TIPOS_HABITACION, ['idTipoHabitacion', 'IdTipoHabitacion', 'id'], ['nombreTipoHabitacion', 'codigoTipoHabitacion']),
      text('numeroHabitacion'),
      number('piso', false),
      number('capacidadHabitacion'),
      money('precioBase'),
      text('descripcionHabitacion', false),
      select('estadoHabitacion', roomState, 'DIS'),
      { name: 'imagenUrl', type: 'image', required: true },
    ],
    transformPayload: (payload) => ({
      ...payload,
      url: payload.url || payload.imagenUrl || payload.ImagenUrl || '',
      imagenUrl: payload.imagenUrl || payload.url || payload.Url || '',
    }),
  },
  tarifas: {
    title: 'Tarifas',
    endpoint: ENDPOINTS.INTERNAL.TARIFAS,
    idKeys: ['idTarifa', 'IdTarifa'],
    columns: ['codigoTarifa', 'nombreTarifa', 'precioPorNoche', 'canalTarifa', 'estadoTarifa'],
    fields: [
      text('codigoTarifa'),
      relation('idSucursal', ENDPOINTS.INTERNAL.SUCURSALES, ['idSucursal', 'IdSucursal', 'id'], ['nombreSucursal', 'codigoSucursal']),
      relation('idTipoHabitacion', ENDPOINTS.INTERNAL.TIPOS_HABITACION, ['idTipoHabitacion', 'IdTipoHabitacion', 'id'], ['nombreTipoHabitacion', 'codigoTipoHabitacion']),
      text('nombreTarifa'),
      select('canalTarifa', rateChannels, 'TODOS'),
      date('fechaInicio'),
      date('fechaFin'),
      money('precioPorNoche'),
      money('porcentajeIva'),
      number('minNoches'),
      number('maxNoches', false),
      checkbox('permitePortalPublico', true),
      number('prioridad'),
      select('estadoTarifa', activeState, 'ACT'),
    ],
  },
  servicios: {
    title: 'Catalogo de servicios',
    endpoint: ENDPOINTS.INTERNAL.CATALOGO_SERVICIOS,
    idKeys: ['idCatalogo', 'IdCatalogo'],
    columns: ['codigoCatalogo', 'nombreCatalogo', 'tipoCatalogo', 'precioBase', 'estadoCatalogo'],
    fields: [
      relation('idSucursal', ENDPOINTS.INTERNAL.SUCURSALES, ['idSucursal', 'IdSucursal', 'id'], ['nombreSucursal', 'codigoSucursal'], false),
      text('codigoCatalogo'),
      text('nombreCatalogo'),
      select('tipoCatalogo', catalogTypes, 'SRV'),
      select('categoriaCatalogo', catalogCategories, '', false),
      text('descripcionCatalogo', false),
      money('precioBase'),
      checkbox('aplicaIva', true),
      checkbox('disponible24h'),
      text('horaInicio', false),
      text('horaFin', false),
      text('iconoUrl', false),
      select('estadoCatalogo', activeState, 'ACT'),
    ],
  },
  clientes: {
    title: 'Clientes',
    endpoint: ENDPOINTS.INTERNAL.CLIENTES,
    idKeys: ['idCliente', 'IdCliente'],
    columns: ['numeroIdentificacion', 'nombres', 'apellidos', 'correo', 'estado'],
    fields: [
      select('tipoIdentificacion', identificationTypes, 'CED'),
      text('numeroIdentificacion'),
      text('nombres'),
      text('apellidos'),
      text('razonSocial', false),
      text('correo'),
      text('telefono', false),
      text('direccion', false),
      select('estado', activeState, 'ACT'),
    ],
    updatePayloadFields: ['nombres', 'apellidos', 'razonSocial', 'correo', 'telefono', 'direccion', 'estado'],
  },
  reservas: {
    title: 'Reservas',
    endpoint: ENDPOINTS.INTERNAL.RESERVAS,
    idKeys: ['idReserva', 'IdReserva'],
    columns: ['idCliente', 'idSucursal', 'fechaInicio', 'fechaFin', 'estadoReserva'],
    fields: [
      relation('idCliente', ENDPOINTS.INTERNAL.CLIENTES, ['idCliente', 'IdCliente', 'id'], ['nombres', 'apellidos', 'numeroIdentificacion']),
      relation('idSucursal', ENDPOINTS.INTERNAL.SUCURSALES, ['idSucursal', 'IdSucursal', 'id'], ['nombreSucursal', 'codigoSucursal']),
      relationMultiple('habitaciones', ENDPOINTS.INTERNAL.HABITACIONES, ['idHabitacion', 'IdHabitacion', 'id'], ['numeroHabitacion']),
      date('fechaInicio'),
      date('fechaFin'),
      money('subtotalReserva'),
      money('valorIva'),
      money('totalReserva'),
      number('descuentoAplicado', false),
      money('saldoPendiente'),
      select('origenCanalReserva', bookingOrigins, 'ADMIN'),
      select('estadoReserva', bookingState, 'PEN'),
      text('observaciones', false),
      checkbox('esWalkin', false),
    ],
    transformPayload: (payload) => {
      const p = { ...payload }
      if (p.habitaciones && Array.isArray(p.habitaciones)) {
        p.habitaciones = p.habitaciones.map(id => ({ idHabitacion: Number(id) }))
      } else if (p.idHabitacion) {
        p.habitaciones = [{ idHabitacion: Number(p.idHabitacion) }]
        delete p.idHabitacion
      }
      return p
    },
    actions: ['confirmarReserva', 'cancelarReserva'],
  },
  estadias: {
    title: 'Estadias',
    endpoint: ENDPOINTS.INTERNAL.ESTADIAS,
    idKeys: ['idEstadia', 'IdEstadia'],
    columns: ['idReserva', 'checkinUtc', 'checkoutUtc', 'estadoEstadia'],
    fields: [select('estadoEstadia', stayState, 'ACT')],
    readonly: true,
    actions: ['checkout'],
  },
  facturas: {
    title: 'Facturas',
    endpoint: ENDPOINTS.INTERNAL.FACTURAS,
    idKeys: ['idFactura', 'IdFactura'],
    columns: ['idReserva', 'numeroFactura', 'total', 'estado'],
    fields: [select('estado', invoiceState, 'EMI')],
    readonly: true,
    actions: ['anularFactura'],
  },
  pagos: {
    title: 'Pagos',
    endpoint: ENDPOINTS.INTERNAL.PAGOS,
    idKeys: ['idPago', 'IdPago'],
    columns: ['idFactura', 'idReserva', 'monto', 'metodoPago', 'estadoPago'],
    fields: [
      relation('idFactura', ENDPOINTS.INTERNAL.FACTURAS, ['idFactura', 'IdFactura', 'id'], ['numeroFactura']),
      relation('idReserva', ENDPOINTS.INTERNAL.RESERVAS, ['idReserva', 'IdReserva', 'id'], ['idReserva', 'IdReserva']),
      money('monto'),
      select('metodoPago', paymentMethods, 'EFECTIVO'),
      checkbox('esPagoElectronico'),
      text('proveedorPasarela', false),
      text('transaccionExterna', false),
      text('codigoAutorizacion', false),
      text('referencia', false),
      select('estadoPago', paymentState, 'PEN'),
      select('moneda', currencies, 'USD'),
      money('tipoCambio'),
      text('respuestaPasarela', false),
    ],
    defaults: { moneda: 'USD', tipoCambio: 1, fechaPagoUtc: () => new Date().toISOString() },
  },
  usuarios: {
    title: 'Usuarios',
    endpoint: ENDPOINTS.INTERNAL.USUARIOS,
    idKeys: ['idUsuario', 'IdUsuario'],
    columns: ['username', 'correo', 'nombres', 'apellidos', 'estadoUsuario'],
    fields: [
      relation('idCliente', ENDPOINTS.INTERNAL.CLIENTES, ['idCliente', 'IdCliente', 'id'], ['nombres', 'apellidos', 'numeroIdentificacion'], false),
      text('username'),
      text('correo'),
      text('nombres'),
      text('apellidos'),
      select('estadoUsuario', userState, 'ACT'),
      active,
      relation('idRol', ENDPOINTS.INTERNAL.ROLES, ['idRol', 'IdRol', 'id'], ['nombreRol'], false),
      text('roles', false),
    ],
    transformPayload: (payload, mode) => ({
      ...payload,
      roles: String(payload.roles || '')
        .split(',')
        .map((id) => Number(id.trim()))
        .filter(Boolean)
        .map((id) => (mode === 'update' ? { idRol: id } : id)),
    }),
    updatePayloadFields: ['correo', 'nombres', 'apellidos', 'estadoUsuario', 'activo', 'roles'],
  },
  roles: {
    title: 'Roles',
    endpoint: ENDPOINTS.INTERNAL.ROLES,
    idKeys: ['idRol', 'IdRol'],
    columns: ['nombreRol', 'descripcionRol', 'estadoRol', 'activo'],
    fields: [text('nombreRol'), text('descripcionRol', false), select('estadoRol', activeState, 'ACT'), active],
  },
  auditoria: {
    title: 'Auditoria',
    endpoint: ENDPOINTS.INTERNAL.AUDITORIA,
    idKeys: ['idAuditoria', 'IdAuditoria', 'auditoriaGuid'],
    columns: ['tabla', 'accion', 'usuario', 'fechaUtc'],
    readonly: true,
  },
  valoraciones: {
    title: 'Valoraciones',
    endpoint: ENDPOINTS.INTERNAL.VALORACIONES,
    idKeys: ['idValoracion', 'IdValoracion'],
    columns: ['idCliente', 'idSucursal', 'puntuacionLimpieza', 'estadoValoracion'],
    fields: [select('estadoValoracion', reviewState, 'PEN')],
    readonly: true,
    actions: ['moderarValoracion', 'responderValoracion'],
  },
}
