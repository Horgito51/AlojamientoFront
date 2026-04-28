import { useEffect, useState } from 'react'
import { ENDPOINTS } from '../../api/endpoints'
import { adminApi } from '../../api/adminApi'
import hotelImg from '../../assets/images/hotelJJ.png'

const cards = [
  { label: 'Reservas', endpoint: ENDPOINTS.INTERNAL.RESERVAS, tone: 'bg-indigo-600', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: 'Habitaciones', endpoint: ENDPOINTS.INTERNAL.HABITACIONES, tone: 'bg-sky-600', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Pagos', endpoint: ENDPOINTS.INTERNAL.PAGOS, tone: 'bg-emerald-600', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'Valoraciones', endpoint: ENDPOINTS.INTERNAL.VALORACIONES, tone: 'bg-amber-600', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
]

export default function AdminDashboard() {
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.all(cards.map((card) => adminApi.list(card.endpoint).then((items) => ({ ...card, total: items.length })).catch(() => ({ ...card, total: 0 }))))
      .then((items) => alive && setSummary(items))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-indigo-600 text-white shadow-xl">
        <div className="absolute inset-0 opacity-20">
          <img src={hotelImg} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="relative z-10 p-8 sm:p-12 lg:flex lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h1 className="text-3xl font-extrabold sm:text-4xl">¡Bienvenido al Panel Administrativo!</h1>
            <p className="mt-4 text-lg text-indigo-100">
              Desde aquí puedes gestionar todas las operaciones de Alojamiento JJ. 
              Revisa tus reservas, controla el estado de las habitaciones y mantén al día los pagos.
            </p>
          </div>
          <div className="mt-8 lg:mt-0">
            <div className="inline-flex rounded-xl bg-white/10 p-4 backdrop-blur-md">
              <div className="text-center">
                <p className="text-sm font-bold uppercase tracking-widest text-indigo-200">Estado del Sistema</p>
                <p className="mt-1 text-2xl font-bold">Operativo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {(loading ? cards.map((card) => ({ ...card, total: '...' })) : summary).map((card) => (
          <article key={card.label} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className={`absolute right-[-10px] top-[-10px] h-20 w-20 rounded-full opacity-5 transition-transform group-hover:scale-150 ${card.tone}`} />
            
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-white ${card.tone}`}>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{card.total}</p>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <div className={`h-1.5 w-16 rounded-full ${card.tone}`} />
              <span className="text-xs font-semibold text-slate-400">Actualizado ahora</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
