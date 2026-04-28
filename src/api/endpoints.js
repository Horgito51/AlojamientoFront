export const API_VERSION = 'v1';

export const ENDPOINTS = {
  // ==========================================
  // AUTENTICACIÓN
  // ==========================================
  AUTH: {
    base: `api/${API_VERSION}/auth`,
    login: `api/${API_VERSION}/auth/login`,
    registerCliente: `api/${API_VERSION}/auth/register-cliente`,
    register: `api/${API_VERSION}/auth/register`,
  },

  // ==========================================
  // MÓDULOS INTERNOS (ADMINISTRACIÓN)
  // ==========================================
  INTERNAL: {
    // ---- Seguridad ----
    USUARIOS: {
      base: `api/${API_VERSION}/internal/usuarios`,
      byId: (id) => `api/${API_VERSION}/internal/usuarios/${id}`,
      inhabilitar: (id) => `api/${API_VERSION}/internal/usuarios/${id}/inhabilitar`,
    },
    ROLES: {
      base: `api/${API_VERSION}/internal/roles`,
      byId: (id) => `api/${API_VERSION}/internal/roles/${id}`,
      permisos: (rolGuid) => `api/${API_VERSION}/internal/roles/${rolGuid}/permisos`,
    },
    PERMISOS: {
      base: `api/${API_VERSION}/internal/permisos`,
    },
    AUDITORIA: {
      base: `api/${API_VERSION}/internal/auditoria`,
      byId: (id) => `api/${API_VERSION}/internal/auditoria/${id}`,
    },

    // ---- Alojamiento ----
    SUCURSALES: {
      base: `api/${API_VERSION}/internal/sucursales`,
      byId: (id) => `api/${API_VERSION}/internal/sucursales/${id}`,
    },
    TIPOS_HABITACION: {
      base: `api/${API_VERSION}/internal/tipos-habitacion`,
      byId: (id) => `api/${API_VERSION}/internal/tipos-habitacion/${id}`,
    },
    HABITACIONES: {
      base: `api/${API_VERSION}/internal/habitaciones`,
      byId: (id) => `api/${API_VERSION}/internal/habitaciones/${id}`,
      estado: (id) => `api/${API_VERSION}/internal/habitaciones/${id}/estado`,
    },
    TARIFAS: {
      base: `api/${API_VERSION}/internal/tarifas`,
      byId: (id) => `api/${API_VERSION}/internal/tarifas/${id}`,
    },
    CATALOGO_SERVICIOS: {
      base: `api/${API_VERSION}/internal/catalogo-servicios`,
      byId: (id) => `api/${API_VERSION}/internal/catalogo-servicios/${id}`,
    },

    // ---- Reservas ----
    RESERVAS: {
      base: `api/${API_VERSION}/internal/reservas`,
      calcularPrecio: `api/${API_VERSION}/internal/reservas/calcular-precio`,
      byId: (id) => `api/${API_VERSION}/internal/reservas/${id}`,
      confirmar: (id) => `api/${API_VERSION}/internal/reservas/${id}/confirmar`,
      cancelar: (id) => `api/${API_VERSION}/internal/reservas/${id}/cancelar`,
    },
    CLIENTES: {
      base: `api/${API_VERSION}/internal/clientes`,
      byId: (id) => `api/${API_VERSION}/internal/clientes/${id}`,
    },

    // ---- Hospedaje ----
    ESTADIAS: {
      base: `api/${API_VERSION}/internal/estadias`,
      byId: (id) => `api/${API_VERSION}/internal/estadias/${id}`,
      checkin: (idReserva) => `api/${API_VERSION}/internal/estadias/checkin/${idReserva}`,
      checkout: (id) => `api/${API_VERSION}/internal/estadias/${id}/checkout`,
      cargos: (id) => `api/${API_VERSION}/internal/estadias/${id}/cargos`,
    },
    CARGOS_ESTADIA: {
      base: `api/${API_VERSION}/internal/cargos-estadia`,
      anular: (id) => `api/${API_VERSION}/internal/cargos-estadia/${id}/anular`,
    },

    // ---- Pagos & Facturación ----
    PAGOS: {
      base: `api/${API_VERSION}/internal/pagos`,
      byId: (id) => `api/${API_VERSION}/internal/pagos/${id}`,
      byFactura: (idFactura) => `api/${API_VERSION}/internal/pagos/factura/${idFactura}`,
      estado: (id) => `api/${API_VERSION}/internal/pagos/${id}/estado`,
      simular: `api/${API_VERSION}/pagos/simular`,
    },
    FACTURAS: {
      base: `api/${API_VERSION}/internal/facturas`,
      byId: (id) => `api/${API_VERSION}/internal/facturas/${id}`,
      generarReserva: (id) => `api/${API_VERSION}/internal/facturas/generar-reserva/${id}`,
    },

    // ---- Valoraciones ----
    VALORACIONES: {
      base: `api/${API_VERSION}/internal/valoraciones`,
      byId: (id) => `api/${API_VERSION}/internal/valoraciones/${id}`,
      moderar: (id) => `api/${API_VERSION}/internal/valoraciones/${id}/moderar`,
      responder: (id) => `api/${API_VERSION}/internal/valoraciones/${id}/responder`,
    }
  },

  // ==========================================
  // PÚBLICO / RESERVAS (EXTERNAL)
  // ==========================================
  PUBLIC: {
    USUARIOS: `api/v1/public/usuarios`,
    CLIENTES: {
      base: `api/v1/public/clientes`,
      byEmail: (correo) => `api/v1/public/clientes/by-email?correo=${encodeURIComponent(correo)}`,
    },
    RESERVAS: {
      base: `api/v1/public/reservas`,
      calcularPrecio: `api/v1/public/reservas/calcular-precio`,
    },
    PAGOS: {
      simular: `api/v1/public/pagos/simular`,
    },
    TIPOS_HABITACION: `api/v1/public/tipos-habitacion`,
    SUCURSALES: `api/v1/public/sucursales`,
    ROLES: `api/v1/public/roles`,
    HABITACIONES: `api/v1/public/habitaciones`,
    ACCOMMODATIONS: `api/v1/accommodations`
  }
};

export default ENDPOINTS;
