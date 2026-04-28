import { useState } from 'react'
import { reservationService } from '../../api/reservationService'

const getReservationId = (reservation) => reservation?.idReserva ?? reservation?.IdReserva ?? reservation?.id

export default function PaymentModal({ reservation, total, onSuccess, onClose }) {
  const [card, setCard] = useState({
    number: '4242 4242 4242 4242',
    name: '',
    expiry: '',
    cvv: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (event) => {
    const { name, value } = event.target
    setCard((current) => ({ ...current, [name]: value }))
    setError('')
  }

  const pay = async (event) => {
    event.preventDefault()
    const idReserva = getReservationId(reservation)

    if (!idReserva) {
      setError('No se encontro la reserva para pagar.')
      return
    }

    if (!card.name.trim() || !card.expiry.trim() || !card.cvv.trim()) {
      setError('Completa los datos de la tarjeta.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await reservationService.simulatePayment({
        idReserva,
        monto: Number(total || reservation?.totalReserva || reservation?.TotalReserva || 0),
      })
      onSuccess(result)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'No se pudo procesar el pago.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
      <form onSubmit={pay} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">Pago de reserva</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Total: ${Number(total || 0).toFixed(2)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            Cerrar
          </button>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Numero de tarjeta
            <input name="number" value={card.number} onChange={update} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
          </label>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Nombre
            <input name="name" value={card.name} onChange={update} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Vence
              <input name="expiry" value={card.expiry} onChange={update} placeholder="12/28" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              CVV
              <input name="cvv" value={card.cvv} onChange={update} maxLength="4" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
            </label>
          </div>
        </div>

        {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button disabled={loading} className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-60">
          {loading ? 'Procesando pago...' : 'Pagar'}
        </button>
      </form>
    </div>
  )
}
