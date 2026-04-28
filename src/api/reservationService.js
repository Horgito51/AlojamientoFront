import api from './axiosConfig';
import { ENDPOINTS } from './endpoints';
import { normalizeEntity, normalizeList } from './normalize';

const isMissingPublicEndpoint = (error) => [404, 405].includes(error.response?.status);
const normalizeEmail = (value) => value?.trim().toLowerCase();

export const reservationService = {
  /**
   * Obtiene todas las habitaciones disponibles para el marketplace
   */
  async getHabitaciones() {
    try {
      const { data } = await api.get(ENDPOINTS.PUBLIC.HABITACIONES);
      return normalizeList(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw error;
    }
  },

  /**
   * Crea una nueva reserva
   * @param {Object} reservationData 
   */
  async createReserva(reservationData) {
    try {
      const { data } = await api.post(ENDPOINTS.INTERNAL.RESERVAS.base, reservationData);
      return data;
    } catch (error) {
      console.error('Error creating reservation:', error);
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
      if (!isMissingPublicEndpoint(error)) throw error;
    }

    try {
      const { data } = await api.get(ENDPOINTS.INTERNAL.CLIENTES.base, {
        params: { page: 1, pageSize: 500 },
      });
      const clientes = normalizeList(data);
      return clientes.find((cliente) => normalizeEmail(cliente.correo) === email) || null;
    } catch (error) {
      if (error.response?.status === 401) return null;
      throw error;
    }
  },

  async createCliente(clienteData) {
    try {
      const { data } = await api.post(ENDPOINTS.PUBLIC.CLIENTES.base, clienteData);
      return normalizeEntity(data);
    } catch (error) {
      if (!isMissingPublicEndpoint(error)) throw error;

      const { data } = await api.post(ENDPOINTS.INTERNAL.CLIENTES.base, clienteData);
      return normalizeEntity(data);
    }
  },

  async createPublicReserva(reservationData) {
    try {
      const { data } = await api.post(ENDPOINTS.PUBLIC.RESERVAS.base, reservationData);
      return normalizeEntity(data);
    } catch (error) {
      if (!isMissingPublicEndpoint(error)) throw error;

      const { data } = await api.post(ENDPOINTS.INTERNAL.RESERVAS.base, reservationData);
      return normalizeEntity(data);
    }
  },

  async simulatePayment(paymentData) {
    const { data } = await api.post(ENDPOINTS.PUBLIC.PAGOS.simular, paymentData);
    return normalizeEntity(data);
  }
};
