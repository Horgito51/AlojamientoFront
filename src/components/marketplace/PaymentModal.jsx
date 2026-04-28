import { useState } from 'react'
import { reservationService } from '../../api/reservationService'
import { Modal } from '../common/Modal' 
import { getErrorMessage } from '../../utils/sweetAlert'

export default function PaymentModal({ reservationData, user, total, onSuccess, onClose }) {
  const [card, setCard] = useState({
    number: '',
    name: user?.nombres ? `${user.nombres} ${user.apellidos || ''}`.trim() : '',
    expiry: '',
    cvv: '',
  })
  const [cardType, setCardType] = useState('visa')
  const [status, setStatus] = useState('idle') 
  const [error, setError] = useState('')

  const update = (event) => {
    let { name, value } = event.target
    
    if (name === 'number') {
      value = value.replace(/\D/g, '').substring(0, 16)
      value = value.match(/.{1,4}/g)?.join(' ') || value
      if (value.startsWith('4')) setCardType('visa')
      else if (value.startsWith('5')) setCardType('mastercard')
    }
    
    if (name === 'expiry') {
      value = value.replace(/\D/g, '').substring(0, 4)
      if (value.length >= 2) value = value.substring(0, 2) + '/' + value.substring(2)
    }

    if (name === 'cvv') {
      value = value.replace(/\D/g, '').substring(0, 4)
    }

    setCard((current) => ({ ...current, [name]: value }))
    setError('')
  }

  const getPaymentStatus = (paymentResult) => {
    const value = String(
      paymentResult?.estadoPago ||
      paymentResult?.EstadoPago ||
      paymentResult?.estado ||
      paymentResult?.Estado ||
      paymentResult?.status ||
      paymentResult?.Status ||
      ''
    ).toUpperCase()
    return value
  }

  const isPaymentApproved = (paymentResult) => {
    const paymentStatus = getPaymentStatus(paymentResult)
    return (
      ['APR', 'CON', 'PAG', 'OK', 'PAID', 'APROBADO', 'APPROVED', 'SUCCESS', 'COMPLETADO'].includes(paymentStatus) ||
      paymentResult?.success === true ||
      paymentResult?.Success === true ||
      paymentResult?.aprobado === true ||
      paymentResult?.Aprobado === true
    )
  }

  const pay = async (event) => {
    event.preventDefault()

    const cardNumber = card.number.replace(/\D/g, '')
    const [expiryMonth, expiryYear] = card.expiry.split('/').map((item) => Number(item))
    const currentYear = Number(String(new Date().getFullYear()).slice(-2))
    const currentMonth = new Date().getMonth() + 1

    if (!card.name.trim() || cardNumber.length !== 16 || !card.expiry.trim() || !card.cvv.trim()) {
      setError('Completa nombre, numero de tarjeta, expiracion y CVC.')
      return
    }

    if (!expiryMonth || expiryMonth < 1 || expiryMonth > 12 || !expiryYear || expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
      setError('La fecha de expiracion no es valida.')
      return
    }

    if (!/^\d{3,4}$/.test(card.cvv)) {
      setError('El CVC debe tener 3 o 4 digitos.')
      return
    }

    setStatus('processing')
    setError('')
    
    let createdReservaId = null
    
    try {
      // 1. Crear la reserva PRIMERO para obtener un ID real
      const createdReserva = await reservationService.createPublicReserva(reservationData)
      
      // Intentar obtener ID en varios formatos (PascalCase, camelCase)
      createdReservaId = createdReserva?.IdReserva ?? createdReserva?.idReserva ?? createdReserva?.id ?? createdReserva?.Id
      const reservaTotal = createdReserva?.TotalReserva ?? createdReserva?.totalReserva ?? total

      if (!createdReservaId) {
        throw new Error('No se pudo obtener el identificador de la reserva. Por favor, contacta a soporte.')
      }

      // 2. Simular el pago con el ID real
      const paymentResult = await reservationService.simulatePayment({
        idReserva: Number(createdReservaId),
        monto: Number(reservaTotal || 0),
      })

      if (!isPaymentApproved(paymentResult)) {
        // 3. Si el pago falla, CANCELAMOS la reserva creada (Rollback atómico)
        try {
          await reservationService.cancelReserva(createdReservaId, 'Pago rechazado o cancelado en pasarela.')
        } catch (cancelErr) {
          console.error('Error in rollback:', cancelErr)
        }
        
        setStatus('error')
        setError(paymentResult?.mensaje || paymentResult?.Mensaje || 'El pago fue rechazado. La reserva ha sido cancelada por seguridad.')
        return
      }

      // 4. Éxito total
      setStatus('success')
      setTimeout(() => {
        onSuccess(createdReserva)
        onClose()
      }, 1500)

    } catch (err) {
      console.error('Payment/Reservation error:', err)
      
      // Si ya se había creado la reserva pero falló algo después, intentamos cancelar
      if (createdReservaId && status !== 'success') {
        try {
          await reservationService.cancelReserva(createdReservaId, 'Error técnico durante el proceso de pago.')
        } catch { /* ignore */ }
      }

      setStatus('error')
      setError(getErrorMessage(err))
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Pasarela de Pago Segura">
      <div className="p-1">
        {status === 'success' ? (
          <div className="py-8 text-center animate__animated animate__fadeIn">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">¡Pago Exitoso!</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Tu reserva ha sido confirmada correctamente.</p>
          </div>
        ) : status === 'processing' ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 dark:border-slate-800 dark:border-t-indigo-500"></div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Procesando</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Creando reserva y validando pago...</p>
          </div>
        ) : (
          <form onSubmit={pay} className="space-y-6">
            {/* Summary Box with premium aesthetics */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 to-violet-700 p-8 shadow-2xl shadow-indigo-500/30 dark:from-indigo-500 dark:to-violet-600">
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100/60">Total a pagar</p>
                  <p className="mt-1 text-4xl font-black text-white">${Number(total || 0).toFixed(2)}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-xl border border-white/10">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-indigo-400/20 blur-2xl" />
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Número de Tarjeta
                </label>
                <div className="relative">
                  <input 
                    name="number" 
                    value={card.number} 
                    onChange={update} 
                    placeholder="0000 0000 0000 0000"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-900" 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {cardType === 'visa' ? (
                      <div className="text-blue-600 font-black italic text-xl">VISA</div>
                    ) : (
                      <div className="text-orange-500 font-black italic text-xl">MC</div>
                    )}
                  </div>
                </div>
              </div>
 
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Titular de la Tarjeta
                </label>
                <input 
                  name="name" 
                  value={card.name} 
                  onChange={update} 
                  placeholder="NOMBRE COMO APARECE EN LA TARJETA"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-900" 
                />
              </div>
 
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Expiración
                  </label>
                  <input 
                    name="expiry" 
                    value={card.expiry} 
                    onChange={update} 
                    placeholder="MM / YY" 
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-900" 
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    CVC
                  </label>
                  <input 
                    name="cvv" 
                    value={card.cvv} 
                    onChange={update} 
                    maxLength="4" 
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="•••"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-900" 
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-400 animate__animated animate__shakeX">
                <svg className="h-5 w-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={status === 'processing'} 
              className="group relative w-full overflow-hidden rounded-[2rem] bg-indigo-600 py-5 font-black text-white transition-all hover:bg-indigo-700 active:scale-[0.97] disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="relative z-10 flex items-center justify-center gap-3 text-lg uppercase tracking-wider">
                Confirmar y Pagar
                <svg className="h-6 w-6 transition-transform group-hover:translate-x-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </button>
            
            <p className="flex items-center justify-center gap-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Pago Encriptado AES-256
            </p>
          </form>
        )}
      </div>
    </Modal>
  )
}
