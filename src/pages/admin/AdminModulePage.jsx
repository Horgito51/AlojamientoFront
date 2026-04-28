import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { adminModules } from '../../data/adminModules'
import { adminApi } from '../../api/adminApi'
import { ENDPOINTS } from '../../api/endpoints'
import AdminDataTable from '../../components/admin/AdminDataTable'
import { getActionLabel, getFieldLabel, getFieldValueLabel, getStatusTone, isStatusField, readValue, resolveId } from '../../utils/adminModule'
import { confirmDelete, showError, showSuccess } from '../../utils/sweetAlert'
import PaymentModal from '../../components/common/PaymentModal'

const iconPaths = {
  view: 'M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12Zm9.75 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  edit: 'M16.862 3.487a2.1 2.1 0 0 1 2.97 2.97L8.99 17.299l-4.24.707.707-4.24L16.862 3.487ZM19 20H5',
  delete: 'M4 7h16M9 7V5h6v2m-8 0 .8 13h8.4L17 7M10 11v5M14 11v5',
  check: 'M20 6 9 17l-5-5',
  cancel: 'M6 6l12 12M18 6 6 18',
  exit: 'M4 4h10v16H4zM14 12h7m-3-3 3 3-3 3',
  shield: 'M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-5',
  reply: 'M10 8H5v5m0 0 5 5M5 13h9a5 5 0 0 0 0-10h-1',
  payment: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z',
}

function ActionIcon({ name }) {
  const path = iconPaths[name] || iconPaths.view
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const actionIconName = (action) => ({
  confirmarReserva: 'check',
  cancelarReserva: 'cancel',
  checkout: 'exit',
  anularFactura: 'cancel',
  moderarValoracion: 'shield',
  responderValoracion: 'reply',
  ejecutarPago: 'payment',
})[action] || 'view'

const asArray = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.$values)) return value.$values
  return []
}

const formatCurrency = (value, currency = 'USD') =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency }).format(Number(value) || 0)

const formatDate = (value) => {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

const fieldValue = (row, key, fallback = '') => readValue(row, key) || fallback
const normalizeState = (value) => String(value ?? '').trim().toUpperCase()

const getActionAvailability = (action, row) => {
  const reservaState = normalizeState(readValue(row, 'estadoReserva'))
  const estadiaState = normalizeState(readValue(row, 'estadoEstadia'))
  const facturaState = normalizeState(readValue(row, 'estado'))
  const valoracionState = normalizeState(readValue(row, 'estadoValoracion'))

  if (action === 'confirmarReserva' && reservaState === 'CON') {
    return { disabled: true, reason: 'La reserva ya esta confirmada.' }
  }
  if (action === 'confirmarReserva' && ['CAN', 'EXP', 'FIN'].includes(reservaState)) {
    return { disabled: true, reason: 'La reserva ya no se puede confirmar.' }
  }
  if (action === 'cancelarReserva' && reservaState === 'CAN') {
    return { disabled: true, reason: 'La reserva ya esta cancelada.' }
  }
  if (action === 'cancelarReserva' && ['FIN', 'EXP'].includes(reservaState)) {
    return { disabled: true, reason: 'La reserva ya no se puede cancelar.' }
  }
  if (action === 'checkout' && ['FIN', 'CAN'].includes(estadiaState)) {
    return { disabled: true, reason: 'La estadia ya esta cerrada.' }
  }
  if (action === 'anularFactura' && facturaState === 'ANU') {
    return { disabled: true, reason: 'La factura ya esta anulada.' }
  }
  if (action === 'moderarValoracion' && ['APR', 'PUB', 'OCU'].includes(valoracionState)) {
    return { disabled: true, reason: 'La valoracion ya fue moderada.' }
  }

  return { disabled: false, reason: '' }
}

export default function AdminModulePage() {
  const { moduleKey } = useParams()
  const navigate = useNavigate()
  const module = adminModules[moduleKey]
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [invoiceDetail, setInvoiceDetail] = useState(null)
  const [paymentDetail, setPaymentDetail] = useState(null)
  const [loadingInvoiceDetail, setLoadingInvoiceDetail] = useState(false)
  const [loadingPaymentDetail, setLoadingPaymentDetail] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [selectedReserva, setSelectedReserva] = useState(null)
  const [paymentInvoiceFilter, setPaymentInvoiceFilter] = useState('')

  const columns = useMemo(() => module?.columns || [], [module])

  const load = async () => {
    if (!module) return
    setLoading(true)
    setError('')
    try {
      const items = moduleKey === 'pagos' && paymentInvoiceFilter
        ? await adminApi.list(ENDPOINTS.INTERNAL.PAGOS.byFactura(paymentInvoiceFilter))
        : await adminApi.list(module.endpoint)
      setRows(items)
    } catch {
      setError('No se pudo cargar el modulo. Verifica backend o permisos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    Promise.resolve().then(load)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleKey, paymentInvoiceFilter])

  if (!module) {
    return <div className="rounded-lg bg-white p-6 dark:bg-slate-900">Modulo no encontrado.</div>
  }

  const getRowId = (row) => resolveId(row, module)
  const getColumnValue = (row, column) => {
    const value = readValue(row, column)
    if ((column === 'imagenUrl' || column === 'url') && value) {
      return <img src={value} alt="Imagen" className="h-10 w-14 rounded object-cover" />
    }
    const field = module.fields?.find((item) => item.name === column)
    const rawLabel = getFieldValueLabel(field, value) ?? ''
    const label = column === 'activo'
      ? value ? 'Activo' : 'Inactivo'
      : rawLabel

    if (isStatusField(column)) {
      const tone = getStatusTone(value, label)
      return (
        <span className={`admin-status-badge admin-status-${tone}`}>
          <span className="admin-status-dot" aria-hidden="true" />
          {String(label || value || 'Sin estado')}
        </span>
      )
    }

    return String(label ?? '')
  }

  const remove = async (row) => {
    const id = getRowId(row)
    if (!id) return
    const result = await confirmDelete(`Se eliminara el registro ${id}.`)
    if (!result.isConfirmed) return

    setError('')
    try {
      await adminApi.remove(module.endpoint, id)
      await load()
      await showSuccess('Registro eliminado', 'El registro se elimino correctamente.')
    } catch {
      await showError('No se pudo eliminar', 'El backend rechazo la operacion o el registro esta relacionado con otros datos.')
    }
  }

  const openInvoiceDetail = async (row) => {
    const id = getRowId(row)
    if (!id) return

    setLoadingInvoiceDetail(true)
    setInvoiceDetail(row)
    try {
      const detail = await adminApi.get(ENDPOINTS.INTERNAL.FACTURAS, id)
      setInvoiceDetail(detail || row)
    } catch {
      await showError('No se pudo cargar el detalle', 'Se mostrara la informacion disponible en la tabla.')
    } finally {
      setLoadingInvoiceDetail(false)
    }
  }

  const openPaymentDetail = async (row) => {
    const id = getRowId(row)
    if (!id) return

    setLoadingPaymentDetail(true)
    setPaymentDetail(row)
    try {
      const detail = await adminApi.get(ENDPOINTS.INTERNAL.PAGOS, id)
      setPaymentDetail(detail || row)
    } catch {
      await showError('No se pudo cargar el detalle', 'Se mostrara la informacion disponible en la tabla.')
    } finally {
      setLoadingPaymentDetail(false)
    }
  }

  const runAction = async (action, row) => {
    const id = getRowId(row)
    if (!id) {
      await showError('Accion no disponible', 'No se pudo identificar el registro seleccionado.')
      return
    }
    setError('')
    try {
      if (action === 'confirmarReserva') await adminApi.patch(ENDPOINTS.INTERNAL.RESERVAS.confirmar(id))
      if (action === 'cancelarReserva') await adminApi.patch(ENDPOINTS.INTERNAL.RESERVAS.cancelar(id), { motivo: 'Cancelado desde panel administrativo' })
      if (action === 'checkout') await adminApi.patch(ENDPOINTS.INTERNAL.ESTADIAS.checkout(id), { observaciones: 'Checkout desde panel administrativo', requiereMantenimiento: false })
      if (action === 'anularFactura') await adminApi.patch(`${ENDPOINTS.INTERNAL.FACTURAS.byId(id)}/anular`, { motivo: 'Anulado desde panel administrativo' })
      if (action === 'moderarValoracion') await adminApi.patch(ENDPOINTS.INTERNAL.VALORACIONES.moderar(id), { nuevoEstado: 'APR', motivo: 'Aprobada desde panel administrativo' })
      if (action === 'responderValoracion') await adminApi.patch(ENDPOINTS.INTERNAL.VALORACIONES.responder(id), { respuesta: 'Gracias por compartir tu experiencia.' })
      if (action === 'ejecutarPago') {
        setSelectedReserva(row)
        setShowPayment(true)
        return // El modal se encarga del resto
      }
      await load()
      await showSuccess('Accion ejecutada', 'La operacion se completo correctamente.')
    } catch {
      await showError('No se pudo ejecutar', 'La accion no fue aceptada por el backend.')
    }
  }

  const renderActions = (row) => {
    const id = getRowId(row)

    return (
      <div className="flex flex-wrap justify-end gap-2">
        {moduleKey === 'facturas' && (
          <button
            type="button"
            onClick={() => openInvoiceDetail(row)}
            className="admin-action-button admin-action-view"
            title="Ver detalle de factura"
          >
            <ActionIcon name="view" />
            <span>Ver</span>
          </button>
        )}
        {moduleKey === 'pagos' && (
          <button
            type="button"
            onClick={() => openPaymentDetail(row)}
            className="admin-action-button admin-action-view"
            title="Ver detalle de pago"
          >
            <ActionIcon name="view" />
            <span>Ver</span>
          </button>
        )}
        {!module.readonly && (
          <button
            type="button"
            onClick={() => navigate(`/admin/${moduleKey}/${id}/editar`, { state: { row } })}
            className="admin-action-button admin-action-edit"
            title="Editar registro"
          >
            <ActionIcon name="edit" />
            <span>Editar</span>
          </button>
        )}
        {!module.readonly && (
          <button
            type="button"
            onClick={() => remove(row)}
            className="admin-action-button admin-action-delete"
            title="Eliminar registro"
          >
            <ActionIcon name="delete" />
            <span>Eliminar</span>
          </button>
        )}
        {(module.actions || []).map((action) => (
          <ActionButton
            key={action}
            action={action}
            row={row}
            onRun={runAction}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Modulo</p>
          <h1 className="mt-2 text-3xl font-bold">{module.title}</h1>
        </div>
        {!module.readonly && (
          <Link to={`/admin/${moduleKey}/nuevo`} className="inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
            Crear
          </Link>
        )}
      </div>

      {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {moduleKey === 'pagos' && (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault()
              Promise.resolve().then(load)
            }}
          >
            <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
              Filtrar por factura
              <input
                type="number"
                min="1"
                value={paymentInvoiceFilter}
                onChange={(event) => setPaymentInvoiceFilter(event.target.value)}
                placeholder="ID de factura"
                className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <div className="flex gap-2">
              <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                Consultar
              </button>
              <button
                type="button"
                onClick={() => setPaymentInvoiceFilter('')}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Ver todos
              </button>
            </div>
          </form>
        </section>
      )}

      {loading ? (
        <div className="rounded-lg bg-white p-8 text-center text-slate-500 dark:bg-slate-900">Cargando...</div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center text-slate-500 dark:bg-slate-900">No hay registros.</div>
      ) : (
        <AdminDataTable
          columns={columns}
          rows={rows}
          getColumnLabel={getFieldLabel}
          getRowId={getRowId}
          renderValue={getColumnValue}
          renderActions={renderActions}
        />
      )}

      {invoiceDetail && (
        <InvoiceDetailModal
          invoice={invoiceDetail}
          loading={loadingInvoiceDetail}
          onClose={() => setInvoiceDetail(null)}
          renderStatus={(value) => {
            const label = getFieldValueLabel(module.fields?.find((field) => field.name === 'estado'), value) || value
            const tone = getStatusTone(value, label)
            return (
              <span className={`admin-status-badge admin-status-${tone}`}>
                <span className="admin-status-dot" aria-hidden="true" />
                {label || 'Sin estado'}
              </span>
            )
          }}
        />
      )}

      {paymentDetail && (
        <PaymentDetailModal
          payment={paymentDetail}
          loading={loadingPaymentDetail}
          onClose={() => setPaymentDetail(null)}
          renderStatus={(value) => {
            const label = getFieldValueLabel(module.fields?.find((field) => field.name === 'estadoPago'), value) || value
            const tone = getStatusTone(value, label)
            return (
              <span className={`admin-status-badge admin-status-${tone}`}>
                <span className="admin-status-dot" aria-hidden="true" />
                {label || 'Sin estado'}
              </span>
            )
          }}
        />
      )}

      <PaymentModal 
        isOpen={showPayment} 
        onClose={() => setShowPayment(false)} 
        reserva={selectedReserva} 
        onSuccess={load}
        isPublic={false}
      />
    </div>
  )
}

function ActionButton({ action, row, onRun }) {
  const availability = getActionAvailability(action, row)
  const label = getActionLabel(action)

  return (
    <button
      type="button"
      onClick={() => onRun(action, row)}
      disabled={availability.disabled}
      className="admin-action-button admin-action-primary"
      title={availability.reason || label}
    >
      <ActionIcon name={actionIconName(action)} />
      <span>{label}</span>
    </button>
  )
}

function InvoiceDetailModal({ invoice, loading, onClose, renderStatus }) {
  const currency = fieldValue(invoice, 'moneda', 'USD')
  const details = asArray(invoice.detalles ?? invoice.Detalles)
  const summaryItems = [
    ['Subtotal', formatCurrency(fieldValue(invoice, 'subtotal'), currency)],
    ['IVA', formatCurrency(fieldValue(invoice, 'valorIva'), currency)],
    ['Descuento', formatCurrency(fieldValue(invoice, 'descuentoTotal'), currency)],
    ['Saldo pendiente', formatCurrency(fieldValue(invoice, 'saldoPendiente'), currency)],
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} aria-label="Cerrar detalle" />
      <section className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Detalle de factura</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
              {fieldValue(invoice, 'numeroFactura', `Factura ${fieldValue(invoice, 'idFactura')}`)}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Emitida: {formatDate(fieldValue(invoice, 'fechaEmision'))}
            </p>
          </div>
          <button type="button" onClick={onClose} className="admin-icon-button" aria-label="Cerrar">
            <ActionIcon name="cancel" />
          </button>
        </header>

        <div className="overflow-y-auto px-6 py-5">
          {loading && <div className="mb-4 rounded-lg bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200">Cargando detalle completo...</div>}

          <div className="grid gap-4 md:grid-cols-4">
            <div className="invoice-detail-card md:col-span-2">
              <span className="invoice-detail-label">Estado</span>
              <div className="mt-2">{renderStatus(fieldValue(invoice, 'estado'))}</div>
            </div>
            <div className="invoice-detail-card">
              <span className="invoice-detail-label">Reserva</span>
              <strong>{fieldValue(invoice, 'idReserva', 'Sin reserva')}</strong>
            </div>
            <div className="invoice-detail-card">
              <span className="invoice-detail-label">Cliente</span>
              <strong>{fieldValue(invoice, 'idCliente', 'Sin cliente')}</strong>
            </div>
            <div className="invoice-detail-card">
              <span className="invoice-detail-label">Sucursal</span>
              <strong>{fieldValue(invoice, 'idSucursal', 'Sin sucursal')}</strong>
            </div>
            <div className="invoice-detail-card">
              <span className="invoice-detail-label">Tipo</span>
              <strong>{fieldValue(invoice, 'tipoFactura', 'No especificado')}</strong>
            </div>
            <div className="invoice-detail-card">
              <span className="invoice-detail-label">Canal</span>
              <strong>{fieldValue(invoice, 'origenCanalFactura', 'No especificado')}</strong>
            </div>
            <div className="invoice-detail-card md:col-span-2">
              <span className="invoice-detail-label">Total</span>
              <strong className="text-2xl text-indigo-600 dark:text-indigo-300">{formatCurrency(fieldValue(invoice, 'total'), currency)}</strong>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            {summaryItems.map(([label, value]) => (
              <div key={label} className="invoice-detail-card">
                <span className="invoice-detail-label">{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <section className="mt-6">
            <h3 className="text-base font-bold text-slate-950 dark:text-white">Items facturados</h3>
            {details.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Esta factura no incluye lineas de detalle en la respuesta del backend.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
                    <tr>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3 text-right">Cant.</th>
                      <th className="px-4 py-3 text-right">Precio</th>
                      <th className="px-4 py-3 text-right">IVA</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {details.map((item, index) => (
                      <tr key={fieldValue(item, 'idFacturaDetalle', index)} className="bg-white dark:bg-slate-900">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{fieldValue(item, 'descripcionItem', 'Item sin descripcion')}</td>
                        <td className="px-4 py-3">{fieldValue(item, 'tipoItem', 'N/A')}</td>
                        <td className="px-4 py-3 text-right">{fieldValue(item, 'cantidad', 0)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(fieldValue(item, 'precioUnitario'), currency)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(fieldValue(item, 'valorIvaLinea'), currency)}</td>
                        <td className="px-4 py-3 text-right font-bold">{formatCurrency(fieldValue(item, 'totalLinea'), currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {fieldValue(invoice, 'observacionesFactura') && (
            <section className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
              <h3 className="font-bold text-slate-900 dark:text-white">Observaciones</h3>
              <p className="mt-2">{fieldValue(invoice, 'observacionesFactura')}</p>
            </section>
          )}
        </div>
      </section>
    </div>
  )
}

function PaymentDetailModal({ payment, loading, onClose, renderStatus }) {
  const currency = fieldValue(payment, 'moneda', 'USD')
  const gatewayItems = [
    ['Proveedor', fieldValue(payment, 'proveedorPasarela', 'No especificado')],
    ['Transaccion', fieldValue(payment, 'transaccionExterna', 'No registrada')],
    ['Autorizacion', fieldValue(payment, 'codigoAutorizacion', 'No registrada')],
    ['Referencia', fieldValue(payment, 'referencia', 'No registrada')],
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} aria-label="Cerrar detalle" />
      <section className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Detalle de pago</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
              Pago {fieldValue(payment, 'idPago', 'sin identificador')}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Fecha: {formatDate(fieldValue(payment, 'fechaPagoUtc'))}
            </p>
          </div>
          <button type="button" onClick={onClose} className="admin-icon-button" aria-label="Cerrar">
            <ActionIcon name="cancel" />
          </button>
        </header>

        <div className="overflow-y-auto px-6 py-5">
          {loading && <div className="mb-4 rounded-lg bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200">Cargando detalle completo...</div>}

          <div className="grid gap-4 md:grid-cols-4">
            <div className="invoice-detail-card md:col-span-2">
              <span className="invoice-detail-label">Estado</span>
              <div className="mt-2">{renderStatus(fieldValue(payment, 'estadoPago'))}</div>
            </div>
            <div className="invoice-detail-card">
              <span className="invoice-detail-label">Factura</span>
              <strong>{fieldValue(payment, 'idFactura', 'Sin factura')}</strong>
            </div>
            <div className="invoice-detail-card">
              <span className="invoice-detail-label">Reserva</span>
              <strong>{fieldValue(payment, 'idReserva', 'Sin reserva')}</strong>
            </div>
            <div className="invoice-detail-card md:col-span-2">
              <span className="invoice-detail-label">Monto</span>
              <strong className="text-2xl text-indigo-600 dark:text-indigo-300">{formatCurrency(fieldValue(payment, 'monto'), currency)}</strong>
            </div>
            <div className="invoice-detail-card">
              <span className="invoice-detail-label">Metodo</span>
              <strong>{fieldValue(payment, 'metodoPago', 'No especificado')}</strong>
            </div>
            <div className="invoice-detail-card">
              <span className="invoice-detail-label">Electronico</span>
              <strong>{fieldValue(payment, 'esPagoElectronico') ? 'Si' : 'No'}</strong>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            {gatewayItems.map(([label, value]) => (
              <div key={label} className="invoice-detail-card">
                <span className="invoice-detail-label">{label}</span>
                <strong className="break-words">{value}</strong>
              </div>
            ))}
          </div>

          {fieldValue(payment, 'respuestaPasarela') && (
            <section className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
              <h3 className="font-bold text-slate-900 dark:text-white">Respuesta de pasarela</h3>
              <p className="mt-2">{fieldValue(payment, 'respuestaPasarela')}</p>
            </section>
          )}
        </div>
      </section>
    </div>
  )
}
