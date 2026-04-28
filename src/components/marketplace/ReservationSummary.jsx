import React from 'react';
import { APP_CONFIG } from '../../config/appConfig';

const money = (value) => Number((Number(value) || 0).toFixed(2));

const ReservationSummary = ({ selectedRooms, nights, onConfirm, loading, totals, confirmLabel = 'Confirmar Reserva' }) => {
  const subtotal = totals?.subtotal ?? money(selectedRooms.reduce((acc, room) => acc + (Number(room.precioBase) || 0) * nights, 0));
  const iva = totals?.iva ?? money(subtotal * APP_CONFIG.IVA_PERCENTAGE);
  const total = totals?.total ?? money(subtotal + iva);

  if (selectedRooms.length === 0) return null;

  return (
    <div className="sticky top-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">Resumen de Reserva</h2>
      
      <div className="space-y-4">
        <div className="max-h-60 overflow-y-auto pr-2">
          {selectedRooms.map(room => (
            <div key={room.habitacionGuid} className="mb-3 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Habitación {room.numeroHabitacion}</span>
              <span className="text-slate-500 dark:text-slate-400">
                ${room.precioBase} x {nights} {nights === 1 ? 'noche' : 'noches'}
              </span>
            </div>
          ))}
        </div>

        <hr className="border-slate-200 dark:border-slate-800" />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
            <span className="font-semibold text-slate-900 dark:text-white">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">IVA ({APP_CONFIG.IVA_PERCENTAGE * 100}%)</span>
            <span className="font-semibold text-slate-900 dark:text-white">${iva.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
            <span className="text-lg font-bold text-slate-900 dark:text-white">Total</span>
            <span className="text-lg font-bold text-indigo-600">${total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={() => onConfirm({ subtotal, iva, total })}
          disabled={loading || selectedRooms.length === 0}
          className="mt-6 w-full rounded-xl bg-indigo-600 py-4 text-center font-bold text-white transition-all hover:bg-indigo-700 hover:shadow-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Procesando...' : confirmLabel}
        </button>
        
        <p className="mt-4 text-center text-xs text-slate-500">
          No se te cobrará nada todavía. La reserva quedará en estado PENDIENTE.
        </p>
      </div>
    </div>
  );
};

export default ReservationSummary;
