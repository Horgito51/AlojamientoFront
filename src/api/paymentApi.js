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

    // #region agent log
    fetch('http://127.0.0.1:7287/ingest/a863e764-f433-436b-a439-7ec838c455cd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'86bafb'},body:JSON.stringify({sessionId:'86bafb',runId:'initial',hypothesisId:'H1',location:'src/api/paymentApi.js:simularPago:beforePost',message:'Outgoing payment payload',data:{url,isPublic,payloadKeys:Object.keys(payload||{}),hasMoneda:Object.prototype.hasOwnProperty.call(payload||{},'moneda'),hasMonedaUpper:Object.prototype.hasOwnProperty.call(payload||{},'Moneda'),montoType:typeof payload?.monto},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    let response;
    try {
      response = await api.post(url, payload);
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7287/ingest/a863e764-f433-436b-a439-7ec838c455cd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'86bafb'},body:JSON.stringify({sessionId:'86bafb',runId:'initial',hypothesisId:'H2',location:'src/api/paymentApi.js:simularPago:postError',message:'Payment API error response',data:{status:error?.response?.status,errorMessage:error?.response?.data?.message||error?.response?.data?.Message||error?.message,responseData:error?.response?.data},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      throw error;
    }
    const { data, status } = response;
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
