import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { reservationService } from '../../api/reservationService';
import { APP_CONFIG } from '../../config/appConfig';
import RoomCard from '../../components/marketplace/RoomCard';
import ReservationSummary from '../../components/marketplace/ReservationSummary';
import DateRangePicker from '../../components/marketplace/DateRangePicker';

const emptyClientForm = {
  nombres: '',
  apellidos: '',
  correo: '',
  telefono: '',
};

const money = (value) => Number((Number(value) || 0).toFixed(2));
const getRoomId = (room) => Number(room.idHabitacion ?? room.IdHabitacion ?? room.id ?? room.Id);
const getRoomSucursalId = (room) => Number(room.idSucursal ?? room.IdSucursal ?? room.sucursalId ?? APP_CONFIG.DEFAULT_SUCURSAL_ID);
const getClientId = (cliente) => cliente?.idCliente ?? cliente?.IdCliente ?? cliente?.id ?? cliente?.Id;
const toApiDate = (value) => new Date(`${value}T12:00:00`).toISOString();
const getApiMessage = (error) => error.response?.data?.message || error.response?.data?.error || error.message;

const buildClientePayload = (form) => ({
  tipoIdentificacion: 'CED',
  numeroIdentificacion: '',
  nombres: form.nombres.trim(),
  apellidos: form.apellidos.trim(),
  razonSocial: '',
  correo: form.correo.trim().toLowerCase(),
  telefono: form.telefono.trim(),
  direccion: '',
  estado: 'ACT',
});

const MarketplacePage = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientLookupLoading, setClientLookupLoading] = useState(false);
  const [clientLookupMessage, setClientLookupMessage] = useState('');
  const [existingClienteId, setExistingClienteId] = useState(null);
  const [hasReservedBefore, setHasReservedBefore] = useState('no');
  const [clientForm, setClientForm] = useState(emptyClientForm);
  const [error, setError] = useState(null);
  const [dates, setDates] = useState({ checkIn: '', checkOut: '' });

  useEffect(() => {
    let alive = true;

    const fetchRooms = async () => {
      setLoading(true);
      try {
        const data = await reservationService.getHabitaciones();
        if (alive) setRooms(data);
      } catch {
        if (alive) setError('Error al cargar las habitaciones. Por favor, intenta de nuevo mas tarde.');
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchRooms();

    return () => {
      alive = false;
    };
  }, []);

  const handleToggleRoom = (room) => {
    setSelectedRooms(prev => {
      const isAlreadySelected = prev.find(r => r.habitacionGuid === room.habitacionGuid);
      if (isAlreadySelected) return prev.filter(r => r.habitacionGuid !== room.habitacionGuid);
      return [...prev, room];
    });
  };

  const nights = useMemo(() => {
    if (!dates.checkIn || !dates.checkOut) return 0;
    const start = new Date(`${dates.checkIn}T00:00:00`);
    const end = new Date(`${dates.checkOut}T00:00:00`);
    const diffDays = Math.ceil((end - start) / 86400000);
    return diffDays > 0 ? diffDays : 0;
  }, [dates]);

  const totals = useMemo(() => {
    const subtotal = money(selectedRooms.reduce((acc, room) => acc + (Number(room.precioBase) || 0) * nights, 0));
    const iva = money(subtotal * APP_CONFIG.IVA_PERCENTAGE);
    const total = money(subtotal + iva);
    return { subtotal, iva, total, pending: total };
  }, [selectedRooms, nights]);

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDates(prev => ({ ...prev, [name]: value }));
  };

  const validateDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(`${dates.checkIn}T00:00:00`);
    const end = new Date(`${dates.checkOut}T00:00:00`);

    if (!dates.checkIn || !dates.checkOut) {
      Swal.fire('Error', 'Por favor selecciona ambas fechas.', 'error');
      return false;
    }

    if (start < today) {
      Swal.fire('Error', 'La fecha de inicio no puede ser en el pasado.', 'error');
      return false;
    }

    if (end <= start) {
      Swal.fire('Error', 'La fecha de fin debe ser posterior a la de inicio.', 'error');
      return false;
    }

    return true;
  };

  const validateSelection = () => {
    if (!validateDates()) return false;
    if (selectedRooms.length === 0) {
      Swal.fire('Error', 'Selecciona al menos una habitacion.', 'error');
      return false;
    }
    return true;
  };

  const handleContinueToClient = () => {
    if (validateSelection()) setShowClientForm(true);
  };

  const handleClientChange = (e) => {
    const { name, value } = e.target;
    setClientForm(prev => ({ ...prev, [name]: value }));
    if (name === 'correo') {
      setExistingClienteId(null);
      setClientLookupMessage('');
    }
  };

  const handleReservedBeforeChange = (value) => {
    setHasReservedBefore(value);
    setExistingClienteId(null);
    setClientLookupMessage('');
  };

  const findExistingClient = async () => {
    const email = clientForm.correo.trim();
    if (!email) {
      Swal.fire('Error', 'Ingresa tu correo electronico para buscar tus datos.', 'error');
      return null;
    }

    setClientLookupLoading(true);
    setClientLookupMessage('');
    try {
      const cliente = await reservationService.findClienteByEmail(email);
      const idCliente = getClientId(cliente);

      if (!cliente || !idCliente) {
        setExistingClienteId(null);
        setClientLookupMessage('No encontramos un cliente con ese correo. Puedes completar tus datos manualmente.');
        return null;
      }

      setExistingClienteId(Number(idCliente));
      setClientForm({
        nombres: cliente.nombres || cliente.nombre || '',
        apellidos: cliente.apellidos || cliente.apellido || '',
        correo: cliente.correo || email,
        telefono: cliente.telefono || '',
      });
      setClientLookupMessage('Datos encontrados y autocompletados.');
      return cliente;
    } catch {
      setExistingClienteId(null);
      setClientLookupMessage('No se pudo consultar el cliente por correo. Completa tus datos manualmente para continuar.');
      return null;
    } finally {
      setClientLookupLoading(false);
    }
  };

  const validateClientForm = () => {
    const missing = ['nombres', 'apellidos', 'correo', 'telefono'].some((field) => !clientForm[field].trim());
    if (missing) {
      Swal.fire('Error', 'Completa nombre, apellido, correo electronico y telefono.', 'error');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientForm.correo.trim())) {
      Swal.fire('Error', 'Ingresa un correo electronico valido.', 'error');
      return false;
    }

    return true;
  };

  const ensureCliente = async () => {
    if (hasReservedBefore === 'si' && existingClienteId) return existingClienteId;

    if (hasReservedBefore === 'si') {
      const found = await findExistingClient();
      const idCliente = getClientId(found);
      if (idCliente) return Number(idCliente);
    }

    const cliente = await reservationService.createCliente(buildClientePayload(clientForm));
    const idCliente = getClientId(cliente);
    if (!idCliente) throw new Error('El backend no devolvio idCliente al crear el cliente.');
    return Number(idCliente);
  };

  const buildReservaPayload = (idCliente) => {
    const fechaInicio = toApiDate(dates.checkIn);
    const fechaFin = toApiDate(dates.checkOut);

    return {
      idCliente,
      idSucursal: getRoomSucursalId(selectedRooms[0]),
      fechaInicio,
      fechaFin,
      subtotalReserva: totals.subtotal,
      valorIva: totals.iva,
      totalReserva: totals.total,
      descuentoAplicado: 0,
      saldoPendiente: totals.pending,
      origenCanalReserva: APP_CONFIG.CANAL_RESERVA,
      estadoReserva: APP_CONFIG.ESTADO_RESERVA_INICIAL,
      observaciones: '',
      esWalkin: false,
      habitaciones: selectedRooms.map(room => {
        const subtotalLinea = money((Number(room.precioBase) || 0) * nights);
        const valorIvaLinea = money(subtotalLinea * APP_CONFIG.IVA_PERCENTAGE);

        return {
          idHabitacion: getRoomId(room),
          idTarifa: null,
          fechaInicio,
          fechaFin,
          numAdultos: 1,
          numNinos: 0,
          precioNocheAplicado: money(room.precioBase),
          subtotalLinea,
          valorIvaLinea,
          descuentoLinea: 0,
          totalLinea: money(subtotalLinea + valorIvaLinea),
          estadoDetalle: APP_CONFIG.ESTADO_RESERVA_INICIAL,
        };
      }),
    };
  };

  const handleConfirmReservation = async (e) => {
    e.preventDefault();
    if (!validateSelection() || !validateClientForm()) return;

    setSubmitting(true);
    try {
      const idCliente = await ensureCliente();
      const reserva = await reservationService.createPublicReserva(buildReservaPayload(idCliente));
      const code = reserva?.codigoReserva || reserva?.idReserva || 'pendiente';

      Swal.fire('Exito', `Tu reserva ha sido creada correctamente. Codigo: ${code}.`, 'success');
      setSelectedRooms([]);
      setDates({ checkIn: '', checkOut: '' });
      setClientForm(emptyClientForm);
      setHasReservedBefore('no');
      setExistingClienteId(null);
      setClientLookupMessage('');
      setShowClientForm(false);
    } catch (err) {
      const status = err.response?.status;
      const missingPublicEndpoint = status === 401 || status === 404 || status === 405;
      const detail = missingPublicEndpoint
        ? 'El backend no tiene habilitados endpoints publicos para buscar/crear clientes y crear reservas sin autenticacion.'
        : getApiMessage(err);
      Swal.fire('Error', detail || 'No se pudo crear la reserva. Por favor intenta de nuevo.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 dark:bg-black sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Encuentra tu Estancia Perfecta
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Explora nuestras habitaciones exclusivas y reserva en segundos.
          </p>
        </div>

        <DateRangePicker
          checkIn={dates.checkIn}
          checkOut={dates.checkOut}
          onChange={handleDateChange}
          nights={nights}
        />

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
                ))}
              </div>
            ) : error ? (
              <div className="rounded-2xl bg-red-50 p-8 text-center text-red-600">
                {error}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {rooms.map(room => (
                  <RoomCard
                    key={room.habitacionGuid}
                    room={room}
                    isSelected={selectedRooms.some(r => r.habitacionGuid === room.habitacionGuid)}
                    onToggle={handleToggleRoom}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            {showClientForm && (
              <form onSubmit={handleConfirmReservation} className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Datos del cliente</h2>

                <div className="mb-5">
                  <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Ya has reservado con nosotros antes?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                      <input type="radio" name="hasReservedBefore" checked={hasReservedBefore === 'si'} onChange={() => handleReservedBeforeChange('si')} />
                      Si
                    </label>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                      <input type="radio" name="hasReservedBefore" checked={hasReservedBefore === 'no'} onChange={() => handleReservedBeforeChange('no')} />
                      No
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Correo electronico
                    <div className="mt-1 flex gap-2">
                      <input required type="email" name="correo" value={clientForm.correo} onChange={handleClientChange} className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
                      {hasReservedBefore === 'si' && (
                        <button type="button" onClick={findExistingClient} disabled={clientLookupLoading} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-slate-700">
                          {clientLookupLoading ? 'Buscando...' : 'Buscar'}
                        </button>
                      )}
                    </div>
                  </label>

                  {clientLookupMessage && (
                    <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {clientLookupMessage}
                    </p>
                  )}

                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Nombre
                    <input required name="nombres" value={clientForm.nombres} onChange={handleClientChange} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
                  </label>

                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Apellido
                    <input required name="apellidos" value={clientForm.apellidos} onChange={handleClientChange} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
                  </label>

                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Telefono
                    <input required name="telefono" value={clientForm.telefono} onChange={handleClientChange} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
                  </label>
                </div>

                <button type="submit" disabled={submitting} className="mt-6 w-full rounded-xl bg-indigo-600 py-4 text-center font-bold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {submitting ? 'Enviando...' : 'Confirmar reserva'}
                </button>
              </form>
            )}

            <ReservationSummary
              selectedRooms={selectedRooms}
              nights={nights}
              totals={totals}
              loading={submitting}
              onConfirm={handleContinueToClient}
              confirmLabel={showClientForm ? 'Actualizar datos' : 'Continuar'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;
