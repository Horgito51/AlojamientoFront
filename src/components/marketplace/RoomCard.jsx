import React from 'react';
import { getRoomImageUrl } from '../../utils/roomImages';
import { isReservableRoomState } from '../../utils/validation';

const RoomCard = ({ room, isSelected, onToggle }) => {
  const {
    numeroHabitacion,
    precioBase,
    capacidadHabitacion,
    descripcionHabitacion,
    tipoHabitacionSlug
  } = room;
  const isAvailable = isReservableRoomState(room.estadoHabitacion ?? room.EstadoHabitacion ?? 'DIS');

  const displayImage = getRoomImageUrl(room);

  return (
    <div 
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl ${
        isSelected 
          ? 'border-indigo-600 ring-2 ring-indigo-600 ring-opacity-50' 
          : 'border-slate-200 dark:border-slate-800'
      } ${!isAvailable ? 'opacity-60 grayscale' : ''}`}
      onClick={() => isAvailable && onToggle(room)}
      style={{ cursor: isAvailable ? 'pointer' : 'not-allowed' }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {displayImage ? (
        <img 
          src={displayImage} 
          alt={`Habitación ${numeroHabitacion}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-900 text-sm font-semibold text-slate-300">
            Sin imagen
          </div>
        )}
        <div className="absolute top-4 right-4">
          <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white transition-colors ${
            isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-white'
          }`}>
            {isSelected && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
        <div className="absolute bottom-4 left-4">
          <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
            {tipoHabitacionSlug || 'Standard'}
          </span>
        </div>
        {!isAvailable && (
          <div className="absolute inset-x-4 top-4 rounded-full bg-red-600 px-3 py-1 text-center text-xs font-bold uppercase tracking-wide text-white">
            No disponible
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Habitación {numeroHabitacion}
          </h3>
          <div className="text-right">
            <span className="text-xl font-bold text-indigo-600">${precioBase}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">/noche</span>
          </div>
        </div>
        
        <p className="mb-4 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
          {descripcionHabitacion || 'Disfruta de una estancia inolvidable en nuestra habitación equipada con todas las comodidades.'}
        </p>

        <div className="mt-auto flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Capacidad: {capacidadHabitacion}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
