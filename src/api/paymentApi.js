import api from './axiosConfig';
import { ENDPOINTS } from './endpoints';
import { normalizeEntity } from './normalize';

export const paymentApi = {
  /**
   * Simula un pago para una reserva.
   * @param {number} idReserva 
   * @param {number} monto 
   * @param {boolean} isPublic Indica si se usa el endpoint público o el interno.
   */
  async simularPago(idReserva, monto, isPublic = true) {
    const url = isPublic ? ENDPOINTS.PUBLIC.PAGOS.simular : ENDPOINTS.INTERNAL.PAGOS.simular;
    const { data } = await api.post(url, {
      idReserva,
      monto
    });
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
