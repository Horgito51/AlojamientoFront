import api from './axiosConfig';
import { ENDPOINTS } from './endpoints';
import { normalizeEntity } from './normalize';

export const paymentApi = {
  /**
   * Simula un pago para una reserva.
   * @param {number|string} reservaIdOrGuid
   * @param {number} monto 
   * @param {boolean} isPublic Indica si se usa el endpoint público o el interno.
   */
  async simularPago(reservaIdOrGuid, monto, isPublic = true, options = {}) {
    const url = isPublic ? ENDPOINTS.PUBLIC.PAGOS.simular : ENDPOINTS.INTERNAL.PAGOS.simular;
    const payload = isPublic ? {
      reservaGuid: reservaIdOrGuid,
      monto,
      tokenPago: options.tokenPago,
      referencia: options.referencia
    } : {
      idReserva: reservaIdOrGuid,
      monto,
      tokenPago: options.tokenPago,
      referencia: options.referencia
    };

    const { data, status } = await api.post(url, payload);
    if ((data === undefined || data === null || data === '') && status >= 200 && status < 300) {
      return { success: true, estadoPago: 'OK' };
    }
    return normalizeEntity(data);
  },

  /**
   * Genera una factura para una reserva.
   * @param {number} idReserva 
   */
  async generarFactura(idReserva) {
    const { data } = await api.post(ENDPOINTS.INTERNAL.FACTURAS.generarReserva(idReserva));
    return normalizeEntity(data);
  }
};
