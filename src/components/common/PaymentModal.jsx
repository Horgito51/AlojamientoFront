import React, { useState } from 'react';
import { Modal } from './Modal';
import { paymentApi } from '../../api/paymentApi';
import { reservasApi } from '../../api/reservasApi';
import { getErrorMessage } from '../../utils/sweetAlert';

const PaymentModal = ({ isOpen, onClose, reserva, onSuccess, isPublic = true }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, processing, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [cardData, setCardData] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: ''
  });

  if (!reserva) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCardData(prev => ({ ...prev, [name]: value }));
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('processing');
    setErrorMessage('');

    try {
      setStatus('processing');
      setErrorMessage('');

      // 1. Crear Cliente y Reserva PRIMERO para obtener un ID real
      let activeReserva = reserva;

      if (reserva.clientePayload && reserva.reservaPayload) {
        // a. Crear Cliente
        const cliente = await reservasApi.createCliente(reserva.clientePayload);
        const clienteId = cliente.idCliente ?? cliente.id;

        // b. Crear Reserva
        const { room, form, totals } = reserva.reservaPayload;
        const payload = {
          idCliente: Number(clienteId),
          idSucursal: Number(room.idSucursal ?? 1),
          fechaInicio: new Date(`${form.fechaInicio}T12:00:00`).toISOString(),
          fechaFin: new Date(`${form.fechaFin}T12:00:00`).toISOString(),
          subtotalReserva: totals.subtotal,
          valorIva: totals.iva,
          totalReserva: totals.total,
          descuentoAplicado: 0,
          saldoPendiente: totals.total,
          origenCanalReserva: 'WEB',
          estadoReserva: 'PEN',
          observaciones: form.observaciones || '',
          habitaciones: [{ idHabitacion: Number(room.idHabitacion ?? room.id) }]
        };

        activeReserva = await reservasApi.createReserva(payload);
      }

      const idReserva = activeReserva?.IdReserva ?? activeReserva?.idReserva ?? activeReserva?.id ?? activeReserva?.Id;
      const totalToPay = activeReserva?.TotalReserva ?? activeReserva?.totalReserva ?? activeReserva?.total ?? activeReserva?.Total;

      // 2. Procesar Pago (Simulación) con ID REAL
      const paymentResult = await paymentApi.simularPago(idReserva, totalToPay, isPublic);
      
      const isApproved = paymentResult?.estadoPago === 'APR' || paymentResult?.EstadoPago === 'APR' || paymentResult?.estadoPago === 'CON' || paymentResult?.EstadoPago === 'CON';
      
      if (!isApproved) {
        // 3. Si falla, cancelamos
        try {
          await reservasApi.cancelReserva(idReserva, 'Pago rechazado por la pasarela.');
        } catch (c) { /* ignore */ }
        
        setStatus('error');
        setErrorMessage(paymentResult?.mensaje || paymentResult?.Mensaje || 'La tarjeta fue rechazada. La reserva ha sido cancelada por seguridad.');
        setLoading(false);
        return;
      }

      // 4. Pago exitoso -> Generar Factura
      try {
        await paymentApi.generarFactura(idReserva);
      } catch (err) {
        console.warn("Invoice generation failed:", err);
      }

      // 5. Todo listo
      setStatus('success');
      setTimeout(() => {
        onSuccess && onSuccess(activeReserva);
        onClose();
      }, 2000);

    } catch (err) {
      console.error("Payment/Reservation Flow Error:", err);
      setStatus('error');
      setErrorMessage(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pasarela de Pago Segura">
      <div className="payment-container">
        {status === 'success' ? (
          <div className="py-8 text-center animate__animated animate__fadeIn">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">¡Pago Exitoso!</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Tu reserva ha sido confirmada y pagada correctamente.</p>
          </div>
        ) : status === 'processing' ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 dark:border-slate-800 dark:border-t-indigo-500"></div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Procesando Pago</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Validando con la entidad bancaria...</p>
          </div>
        ) : (
          <form onSubmit={handlePayment} className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl bg-indigo-600 p-6 shadow-xl shadow-indigo-500/20 dark:bg-indigo-500">
              <div className="relative z-10">
                <div className="flex items-center justify-between text-white/80">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Detalle de Operación</span>
                  <span className="text-[10px] font-black uppercase">#{reserva.idReserva || reserva.id || 'NUEVA'}</span>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-100/60">Total a pagar</p>
                    <p className="text-3xl font-black text-white">${reserva.totalReserva || reserva.total || reserva.reservaPayload?.totals?.total}</p>
                  </div>
                  <div className="rounded-2xl bg-white/20 p-2 backdrop-blur-md">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Nombre en la Tarjeta</label>
                <input
                  type="text"
                  name="name"
                  placeholder="NOMBRE COMPLETO"
                  required
                  value={cardData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-900"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Número de Tarjeta</label>
                <input
                  type="text"
                  name="number"
                  placeholder="0000 0000 0000 0000"
                  maxLength="16"
                  required
                  value={cardData.number}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Fecha Expiración</label>
                  <input
                    type="text"
                    name="expiry"
                    placeholder="MM/YY"
                    maxLength="5"
                    required
                    value={cardData.expiry}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-900"
                  />
                </div>
                <div className="form-group">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">CVV</label>
                  <input
                    type="password"
                    name="cvv"
                    placeholder="***"
                    maxLength="3"
                    required
                    value={cardData.cvv}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-900"
                  />
                </div>
              </div>
            </div>

            {status === 'error' && (
              <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-600 dark:bg-red-900/20 dark:text-red-400 animate__animated animate__shakeX">
                <svg className="h-4 w-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div dangerouslySetInnerHTML={{ __html: errorMessage }} />
              </div>
            )}

            <button type="submit" className="group relative w-full overflow-hidden rounded-[2rem] bg-indigo-600 py-4 font-black text-white transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50" disabled={loading}>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="relative z-10 flex items-center justify-center gap-2 text-sm uppercase tracking-widest">
                {loading ? 'PROCESANDO...' : `PAGAR $${reserva.totalReserva || reserva.total || reserva.reservaPayload?.totals?.total}`}
              </span>
            </button>
            
            <p className="flex items-center justify-center gap-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Transacción Encriptada
            </p>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default PaymentModal;
