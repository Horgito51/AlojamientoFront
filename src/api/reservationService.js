import api from './axiosConfig';
import { ENDPOINTS } from './endpoints';
import { normalizeEntity, normalizeList } from './normalize';

const normalizeEmail = (value) => value?.trim().toLowerCase();

export const reservationService = {
  /**
   * Obtiene todas las habitaciones disponibles para el marketplace
   */
  async getHabitaciones(params = {}) {
    try {
      const { data } = await api.get(ENDPOINTS.PUBLIC.HABITACIONES, { params });
      return normalizeList(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw error;
    }
  },

  async findClienteByEmail(correo) {
    const email = normalizeEmail(correo);
    if (!email) return null;

    try {
      const { data } = await api.get(ENDPOINTS.PUBLIC.CLIENTES.byEmail(email));
      return normalizeEntity(data);
    } catch (error) {
      if ([401, 404, 405].includes(error.response?.status)) return null;
      throw error;
    }
  },

  async createCliente(clienteData) {
    const { data } = await api.post(ENDPOINTS.PUBLIC.CLIENTES.base, clienteData);
    return normalizeEntity(data);
  },

  async createPublicReserva(reservationData) {
    const { data } = await api.post(ENDPOINTS.PUBLIC.RESERVAS.base, reservationData);
    return normalizeEntity(data);
  },

  async calculatePublicRoomPrice(priceData) {
    const { data } = await api.post(ENDPOINTS.PUBLIC.RESERVAS.calcularPrecio, priceData);
    return normalizeEntity(data);
  },

  async getMisReservas(params = {}) {
    try {
      const { data } = await api.get(ENDPOINTS.PUBLIC.RESERVAS.base, { params });
      return data;
    } catch (error) {
      console.error('Error fetching mis reservas:', error);
      throw error;
    }
  },

  async simulatePayment(paymentData) {
    const { data, status } = await api.post(ENDPOINTS.PUBLIC.PAGOS.simular, paymentData);
    if ((data === undefined || data === null || data === '') && status >= 200 && status < 300) {
      return { success: true, estadoPago: 'OK' };
    }
    return normalizeEntity(data);
  },

  async cancelPublicReserva(reservaGuid, motivo) {
    await api.patch(ENDPOINTS.PUBLIC.RESERVAS.cancelar(reservaGuid), { motivo });
  }
};
