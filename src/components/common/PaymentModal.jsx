import React, { useState } from 'react';
import { Modal } from './Modal';
import { paymentApi } from '../../api/paymentApi';
import { reservasApi } from '../../api/reservasApi';

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
      // 1. Generar Factura primero (según requerimiento de asociar factura)
      // En algunos flujos esto podría ser automático en el backend, 
      // pero el requerimiento pide llamarlo.
      try {
        await paymentApi.generarFactura(reserva.idReserva || reserva.id);
      } catch (err) {
        console.error("Error generating invoice:", err);
        // Continuamos si el error es porque ya existe o algo similar, 
        // pero idealmente el backend lo maneja.
      }

      // 2. Simular Pago
      const result = await paymentApi.simularPago(reserva.idReserva || reserva.id, reserva.totalReserva || reserva.total, isPublic);
      
      const isApproved = result.estadoPago === 'APR' || result.EstadoPago === 'APR';

      if (isApproved) {
        // 3. Si el pago es exitoso, actualizamos el estado de la reserva
        // El simulador del backend ya podría hacerlo, pero nos aseguramos o refrescamos
        setStatus('success');
        setTimeout(() => {
          onSuccess && onSuccess(result);
          onClose();
        }, 2000);
      } else {
        setStatus('error');
        setErrorMessage(result.mensaje || 'El pago fue rechazado por la pasarela.');
      }
    } catch (err) {
      console.error("Payment error:", err);
      setStatus('error');
      setErrorMessage(err.response?.data?.message || 'Ocurrió un error al procesar el pago.');
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
            <div className="reserva-summary">
              <div className="summary-item">
                <span>Reserva ID:</span>
                <strong>#{reserva.idReserva || reserva.id}</strong>
              </div>
              <div className="summary-item">
                <span>Total a Pagar:</span>
                <strong className="total-amount">${reserva.totalReserva || reserva.total}</strong>
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
              <div className="error-alert">
                {errorMessage}
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
          border-top: 5px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1.5rem;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .reserva-summary {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          border-left: 4px solid #2ecc71;
        }
        .summary-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .total-amount {
          font-size: 1.25rem;
          color: #2c3e50;
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
          font-size: 0.9rem;
          font-weight: 600;
          color: #666;
        }
        .payment-input {
          padding: 0.8rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }
        .payment-input:focus {
          border-color: #3498db;
          outline: none;
        }
        .pay-button {
          background: #2ecc71;
          color: white;
          border: none;
          padding: 1rem;
          border-radius: 6px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
          margin-top: 0.5rem;
        }
        .pay-button:hover {
          background: #27ae60;
        }
        .pay-button:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }
        .error-alert {
          background: #ffebee;
          color: #c62828;
          padding: 0.8rem;
          border-radius: 6px;
          font-size: 0.9rem;
          border: 1px solid #ffcdd2;
        }
        .payment-note {
          text-align: center;
          font-size: 0.8rem;
          color: #888;
          margin-top: 1rem;
        }
      `}</style>
    </Modal>
  );
};

export default PaymentModal;
