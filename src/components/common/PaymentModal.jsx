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
      let activeReserva = reserva;

      // Si es un flujo de creación pendiente (público)
      if (reserva.clientePayload && reserva.reservaPayload) {
        // 1. Crear Cliente
        const cliente = await reservasApi.createCliente(reserva.clientePayload);
        const clienteId = cliente.idCliente ?? cliente.id;

        // 2. Crear Reserva
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

      const idReserva = activeReserva.idReserva || activeReserva.id;
      const total = activeReserva.totalReserva || activeReserva.total;

      // 3. Generar Factura
      try {
        await paymentApi.generarFactura(idReserva);
      } catch (err) {
        console.warn("Invoice might already exist or failed, continuing...", err);
      }

      // 4. Procesar Pago
      const result = await paymentApi.simularPago(idReserva, total, isPublic);
      const isApproved = result.estadoPago === 'APR' || result.EstadoPago === 'APR';

      if (isApproved) {
        setStatus('success');
        setTimeout(() => {
          onSuccess && onSuccess(result);
          onClose();
        }, 2000);
      } else {
        setStatus('error');
        setErrorMessage(result.mensaje || 'Pago rechazado por la pasarela.');
      }
    } catch (err) {
      console.error("Payment Flow Error:", err);
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
          <div className="payment-status success">
            <div className="status-icon">✅</div>
            <h3>¡Pago Exitoso!</h3>
            <p>Tu reserva ha sido confirmada y pagada correctamente.</p>
            <p>ID Transacción: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
          </div>
        ) : status === 'processing' ? (
          <div className="payment-status processing">
            <div className="spinner"></div>
            <h3>Procesando Pago...</h3>
            <p>Por favor no cierres esta ventana.</p>
          </div>
        ) : (
          <form onSubmit={handlePayment} className="payment-form">
            <div className="reserva-summary dark:bg-slate-800 dark:border-slate-700">
              <div className="summary-item">
                <span className="dark:text-slate-400">Estado de Reserva:</span>
                <strong className="dark:text-white">#{reserva.idReserva || reserva.id || 'Nuevo Registro'}</strong>
              </div>
              <div className="summary-item">
                <span className="dark:text-slate-400">Total a Pagar:</span>
                <strong className="total-amount dark:text-indigo-400">${reserva.totalReserva || reserva.total || reserva.reservaPayload?.totals?.total}</strong>
              </div>
            </div>

            <div className="form-group">
              <label>Nombre en la Tarjeta</label>
              <input
                type="text"
                name="name"
                placeholder="Nombre Completo"
                required
                value={cardData.name}
                onChange={handleInputChange}
                className="payment-input"
              />
            </div>

            <div className="form-group">
              <label>Número de Tarjeta</label>
              <input
                type="text"
                name="number"
                placeholder="0000 0000 0000 0000"
                maxLength="16"
                required
                value={cardData.number}
                onChange={handleInputChange}
                className="payment-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Fecha Expiración</label>
                <input
                  type="text"
                  name="expiry"
                  placeholder="MM/YY"
                  maxLength="5"
                  required
                  value={cardData.expiry}
                  onChange={handleInputChange}
                  className="payment-input"
                />
              </div>
              <div className="form-group">
                <label>CVV</label>
                <input
                  type="password"
                  name="cvv"
                  placeholder="123"
                  maxLength="3"
                  required
                  value={cardData.cvv}
                  onChange={handleInputChange}
                  className="payment-input"
                />
              </div>
            </div>

            {status === 'error' && (
              <div className="error-alert" dangerouslySetInnerHTML={{ __html: errorMessage }}>
              </div>
            )}

            <button type="submit" className="pay-button" disabled={loading}>
              {loading ? 'Procesando...' : `Pagar $${reserva.totalReserva || reserva.total}`}
            </button>
            
            <p className="payment-note">
              🔒 Tus datos están encriptados y seguros. Esta es una simulación de pago.
            </p>
          </form>
        )}
      </div>

      <style jsx>{`
        .payment-container {
          padding: 1rem;
          color: #333;
        }
        :global(.dark) .payment-container {
          color: #f8fafc;
        }
        .payment-status {
          text-align: center;
          padding: 2rem 0;
        }
        .status-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        .spinner {
          width: 50px;
          height: 50px;
          border: 5px solid #f3f3f3;
          border-top: 5px solid #4f46e5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1.5rem;
        }
        :global(.dark) .spinner {
          border: 5px solid #334155;
          border-top: 5px solid #6366f1;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .reserva-summary {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          border: 1px solid #e2e8f0;
        }
        :global(.dark) .reserva-summary {
          background: #1e293b;
          border-color: #334155;
        }
        .summary-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .total-amount {
          font-size: 1.25rem;
          color: #4f46e5;
          font-weight: 800;
        }
        :global(.dark) .total-amount {
          color: #818cf8;
        }
        .payment-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #64748b;
        }
        :global(.dark) .form-group label {
          color: #94a3b8;
        }
        .payment-input {
          padding: 0.8rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s;
          background: white;
        }
        :global(.dark) .payment-input {
          background: #0f172a;
          border-color: #334155;
          color: white;
        }
        .payment-input:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
          outline: none;
        }
        .pay-button {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 1rem;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 0.5rem;
        }
        .pay-button:hover {
          background: #4338ca;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .pay-button:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          transform: none;
        }
        .error-alert {
          background: #fef2f2;
          color: #b91c1c;
          padding: 0.8rem;
          border-radius: 8px;
          font-size: 0.85rem;
          border: 1px solid #fecaca;
        }
        :global(.dark) .error-alert {
          background: rgba(127, 29, 29, 0.2);
          color: #fca5a5;
          border-color: #7f1d1d;
        }
        .payment-note {
          text-align: center;
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 1rem;
        }
      `}</style>
    </Modal>
  );
};

export default PaymentModal;
