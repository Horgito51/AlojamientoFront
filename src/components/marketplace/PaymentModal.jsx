import { useRef, useState } from 'react'
import { reservationService } from '../../api/reservationService'
import { Modal } from '../common/Modal'
import { getErrorMessage, sanitizeErrorMessage } from '../../utils/sweetAlert'
import { API_BASE_URL } from '../../api/axiosConfig'

// ---------------------------------------------------------------------------
// Helpers – no dependen de estado React, son funciones puras
// ---------------------------------------------------------------------------

/** Desenvuelve wrappers anidados que a veces manda el backend */
const unwrap = (value) => {
  const WRAPPER_KEYS = ['data', 'result', 'reserva', 'Reserva', 'pago', 'Pago', 'payment', 'Payment', 'entity', 'item']
  let current = value
  for (let i = 0; i < 6; i++) {
    if (!current || typeof current !== 'object') return current
    const key = WRAPPER_KEYS.find((k) => current[k] && typeof current[k] === 'object')
    if (!key) return current
    current = current[key]
  }
  return current
}

const getByKey = (obj, key) => {
  if (!obj || typeof obj !== 'object') return undefined
  if (obj[key] !== undefined) return obj[key]

  const match = Object.keys(obj).find((currentKey) => currentKey.toLowerCase() === key.toLowerCase())
  return match ? obj[match] : undefined
}

/** Busca el primer valor no-nulo para cualquiera de las claves indicadas */
const pick = (obj, keys) => {
  const source = unwrap(obj)
  for (const key of keys) {
    const v = getByKey(source, key) ?? getByKey(obj, key)
    if (v !== undefined && v !== null && v !== '') return v
  }
  return null
}

/** Evalúa si el resultado del simulador indica pago aprobado */
const isApproved = (result) => {
  const payment = unwrap(result)
  const rawStatus = String(
    pick(payment, ['estadoPago', 'EstadoPago', 'estado', 'Estado', 'status', 'Status', 'state', 'State']) || ''
  ).toUpperCase()

  const REJECTED = ['REC', 'RECH', 'RECHAZADO', 'DEN', 'DENIED', 'FAILED', 'FAIL', 'ERROR', 'ERR', 'CAN', 'CANCELADO']
  const APPROVED  = ['APR', 'CON', 'PAG', 'OK', 'PAID', 'PAGADO', 'APROBADO', 'APPROVED', 'SUCCESS', 'COMPLETADO']

  if (
    REJECTED.includes(rawStatus) ||
    pick(payment, ['success', 'Success']) === false ||
    pick(payment, ['aprobado', 'Aprobado']) === false
  ) return false

  const hasEvidence = Boolean(
    pick(payment, ['idPago', 'IdPago', 'codigoAutorizacion', 'CodigoAutorizacion', 'transaccionExterna', 'TransaccionExterna', 'referencia', 'Referencia'])
  )

  return (
    APPROVED.includes(rawStatus) ||
    pick(payment, ['success', 'Success']) === true ||
    pick(payment, ['aprobado', 'Aprobado']) === true ||
    hasEvidence
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function PaymentModal({ reservationData, existingReservation, user, total, onSuccess, onClose }) {
  /* ------------------------------------------------------------------ */
  /*  Estado del formulario                                               */
  /* ------------------------------------------------------------------ */
  const [card, setCard] = useState({
    number: '',
    name: user?.nombres ? `${user.nombres} ${user.apellidos || ''}`.trim() : '',
    expiry: '',
    cvv: '',
  })
  const [cardType, setCardType]     = useState('visa')
  const [phase, setPhase]           = useState('idle')   // 'idle' | 'processing' | 'success' | 'error'
  const [stepMsg, setStepMsg]       = useState('')
  const [errorMsg, setErrorMsg]     = useState('')

  // Usamos una ref para la guarda "en vuelo" en lugar de un estado
  // para evitar stale-closure bugs en handlers async
  const submitting = useRef(false)

  /* ------------------------------------------------------------------ */
  /*  Manejo de inputs                                                    */
  /* ------------------------------------------------------------------ */
  const handleChange = (e) => {
    let { name, value } = e.target

    if (name === 'number') {
      value = value.replace(/\D/g, '').substring(0, 16)
      if (value.startsWith('4')) setCardType('visa')
      else if (value.startsWith('5')) setCardType('mastercard')
      // Formateo visual 0000 0000 0000 0000
      value = value.match(/.{1,4}/g)?.join(' ') || value
    }

    if (name === 'expiry') {
      value = value.replace(/\D/g, '').substring(0, 4)
      if (value.length >= 2) value = `${value.substring(0, 2)}/${value.substring(2)}`
    }

    if (name === 'cvv') {
      value = value.replace(/\D/g, '').substring(0, 4)
    }

    setCard((prev) => ({ ...prev, [name]: value }))
    setErrorMsg('')
  }

  /* ------------------------------------------------------------------ */
  /*  Validaciones de tarjeta                                             */
  /* ------------------------------------------------------------------ */
  const validate = () => {
    try {
      const cardNumber   = (card.number || '').replace(/\D/g, '')
      const expiry = card.expiry || ''
      const [mm, yy]     = expiry.split('/').map(Number)
      const nowYear      = Number(String(new Date().getFullYear()).slice(-2))
      const nowMonth     = new Date().getMonth() + 1

      if (!card.name || !card.name.trim()) {
        setErrorMsg('El nombre del titular es obligatorio.')
        return false
      }
      if (cardNumber.length !== 16) {
        setErrorMsg('El número de tarjeta debe tener 16 dígitos.')
        return false
      }
      if (!mm || mm < 1 || mm > 12 || !yy) {
        setErrorMsg('La fecha de expiración no es válida.')
        return false
      }
      if (yy < nowYear || (yy === nowYear && mm < nowMonth)) {
        setErrorMsg('La tarjeta ha expirado.')
        return false
      }
      if (!/^\d{3,4}$/.test(card.cvv || '')) {
        setErrorMsg('El CVC debe tener 3 o 4 dígitos.')
        return false
      }
      return true
    } catch (err) {
      console.error('[PaymentModal] Error en validate:', err)
      setErrorMsg('Error al validar la tarjeta. Por favor revisa los datos.')
      return false
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Flujo de pago                                                       */
  /* ------------------------------------------------------------------ */
  const handlePay = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault()
    }

    // Guarda para evitar doble-submit
    if (submitting.current) return
    if (!validate()) return

    submitting.current = true
    setPhase('processing')
    setStepMsg('Validando datos...')
    setErrorMsg('')

    let createdGuid = pick(existingReservation, ['reservaGuid', 'ReservaGuid', 'guidReserva', 'GuidReserva']) || null
    let reserva = unwrap(existingReservation || null)
    let reservaTotal = pick(reserva, ['totalReserva', 'TotalReserva', 'total', 'Total']) ?? total
    let createdInThisFlow = false

    try {
      // ── 1. Resolver reserva (existente o crear nueva) ────────────────
      if (!createdGuid) {
        setStepMsg('Creando reserva...')
        // #region agent log
        fetch('http://127.0.0.1:7287/ingest/a863e764-f433-436b-a439-7ec838c455cd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'86bafb'},body:JSON.stringify({sessionId:'86bafb',runId:'initial',hypothesisId:'H8',location:'src/components/marketplace/PaymentModal.jsx:handlePay:beforeCreateReserva',message:'Marketplace payment flow start',data:{apiBaseUrl:API_BASE_URL,reservationKeys:Object.keys(reservationData||{}),hasReservaMoneda:Object.prototype.hasOwnProperty.call(reservationData||{},'moneda'),hasReservaMonedaUpper:Object.prototype.hasOwnProperty.call(reservationData||{},'Moneda')},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        console.log('[PaymentModal] Creando reserva con payload:', reservationData)
        const reservaRaw = await reservationService.createPublicReserva(reservationData)
        reserva = unwrap(reservaRaw)
        createdGuid = pick(reserva, ['reservaGuid', 'ReservaGuid', 'guidReserva', 'GuidReserva'])
        reservaTotal = pick(reserva, ['totalReserva', 'TotalReserva', 'total', 'Total']) ?? total
        createdInThisFlow = true
        console.log('[PaymentModal] Reserva creada:', reserva)
      }
      if (!createdGuid) throw new Error('No se pudo obtener el identificador de la reserva para procesar el pago.')

      // ── 2. Simular el pago ───────────────────────────────────────────
      setStepMsg('Procesando pago...')
      const cardNumber = card.number.replace(/\D/g, '')

      const payloadPago = {
        reservaGuid : createdGuid,
        monto       : Number(reservaTotal) || 0,
        moneda      : 'USD',
        Moneda      : 'USD',
        tokenPago   : `card_${cardNumber.slice(-4)}_${Date.now()}`,
        referencia  : `RES-${createdGuid}-${Date.now()}`,
      }
      // #region agent log
      fetch('http://127.0.0.1:7287/ingest/a863e764-f433-436b-a439-7ec838c455cd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'86bafb'},body:JSON.stringify({sessionId:'86bafb',runId:'initial',hypothesisId:'H9',location:'src/components/marketplace/PaymentModal.jsx:handlePay:beforeSimulatePayment',message:'Marketplace payment payload',data:{payloadKeys:Object.keys(payloadPago||{}),hasMoneda:Object.prototype.hasOwnProperty.call(payloadPago||{},'moneda'),hasMonedaUpper:Object.prototype.hasOwnProperty.call(payloadPago||{},'Moneda'),monto:payloadPago.monto},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      console.log('[PaymentModal] Enviando pago:', payloadPago)
      const payResult = await reservationService.simulatePayment(payloadPago)
      console.log('[PaymentModal] Resultado del pago:', payResult)

      // ── 3. Evaluar resultado ─────────────────────────────────────────
      if (!isApproved(payResult)) {
        // Rollback: cancelar la reserva creada
        try {
          await reservationService.cancelPublicReserva(createdGuid, 'Pago rechazado o cancelado en pasarela.')
        } catch (cancelErr) {
          console.error('[PaymentModal] Error en rollback de reserva:', cancelErr)
        }

        let msg = pick(payResult, ['mensaje', 'Mensaje', 'message', 'Message']) || 'El pago fue rechazado. La reserva ha sido cancelada.'
        msg = sanitizeErrorMessage(msg)
        setErrorMsg(msg)
        setPhase('error')
        return
      }

      // ── 4. Éxito ─────────────────────────────────────────────────────
      setPhase('success')
      setStepMsg('')

      setTimeout(() => {
        onSuccess?.({
          ...reserva,
          pago: unwrap(payResult),
        })
        onClose?.()
      }, 1800)

    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7287/ingest/a863e764-f433-436b-a439-7ec838c455cd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'86bafb'},body:JSON.stringify({sessionId:'86bafb',runId:'initial',hypothesisId:'H10',location:'src/components/marketplace/PaymentModal.jsx:handlePay:catch',message:'Marketplace payment flow error',data:{status:err?.response?.status,errorMessage:err?.response?.data?.message||err?.response?.data?.Message||err?.message,errorData:err?.response?.data},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      console.error('[PaymentModal] Error en el flujo de pago:', err?.response?.data ?? err)

      // Intentar cancelar la reserva si ya fue creada
      if (createdGuid && createdInThisFlow) {
        try {
          await reservationService.cancelPublicReserva(createdGuid, 'Error técnico durante el proceso de pago.')
        } catch { /* ignorar */ }
      }

      setPhase('error')
      setErrorMsg(sanitizeErrorMessage(err?.response?.data?.message || err?.response?.data?.Message || getErrorMessage(err)))
    } finally {
      submitting.current = false
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Render                                                              */
  /* ------------------------------------------------------------------ */
  const isProcessing = phase === 'processing'
  const isSuccess    = phase === 'success'

  return (
    <Modal isOpen={true} onClose={isProcessing ? undefined : onClose} title="Pasarela de Pago Segura">
      <div className="p-1">

        {/* ── Estado: Éxito ── */}
        {isSuccess && (
          <div className="py-10 text-center animate__animated animate__fadeIn">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">¡Pago Exitoso!</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Tu reserva ha sido confirmada correctamente.</p>
          </div>
        )}

        {/* ── Estado: Procesando ── */}
        {isProcessing && (
          <div className="py-14 text-center">
            <div className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 dark:border-slate-800 dark:border-t-indigo-500" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Procesando</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{stepMsg || 'Un momento...'}</p>
          </div>
        )}

        {/* ── Estado: Formulario (idle / error) ── */}
        {!isSuccess && !isProcessing && (
          <form onSubmit={handlePay} noValidate className="space-y-6">

            {/* Resumen del monto */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 to-violet-700 p-8 shadow-2xl shadow-indigo-500/30">
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

            {/* Campos de tarjeta */}
            <div className="space-y-5">

              {/* Número */}
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Número de Tarjeta
                </label>
                <div className="relative">
                  <input
                    name="number"
                    value={card.number}
                    onChange={handleChange}
                    placeholder="0000 0000 0000 0000"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-900"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-black italic select-none">
                    {cardType === 'visa'
                      ? <span className="text-blue-600">VISA</span>
                      : <span className="text-orange-500">MC</span>}
                  </div>
                </div>
              </div>

              {/* Titular */}
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Titular de la Tarjeta
                </label>
                <input
                  name="name"
                  value={card.name}
                  onChange={handleChange}
                  placeholder="NOMBRE COMO APARECE EN LA TARJETA"
                  autoComplete="cc-name"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-slate-900"
                />
              </div>

              {/* Expiración + CVC */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Expiración
                  </label>
                  <input
                    name="expiry"
                    value={card.expiry}
                    onChange={handleChange}
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
                    onChange={handleChange}
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

            {/* Mensaje de error */}
            {errorMsg && (
              <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-400 animate__animated animate__shakeX">
                <svg className="h-5 w-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Botón de confirmación */}
            <button
              type="submit"
              onClick={handlePay}
              disabled={submitting.current}
              className="group relative w-full overflow-hidden rounded-[2rem] bg-indigo-600 py-5 font-black text-white transition-all hover:bg-indigo-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="relative z-10 flex items-center justify-center gap-3 text-lg uppercase tracking-wider">
                {submitting.current ? 'Procesando...' : 'Confirmar y Pagar'}
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
