import { useEffect, useState } from 'react'
import { ENDPOINTS } from '../../api/endpoints'
import { adminApi } from '../../api/adminApi'

const cards = [
  { label: 'Reservas', endpoint: ENDPOINTS.INTERNAL.RESERVAS, tone: 'bg-indigo-600' },
  { label: 'Habitaciones', endpoint: ENDPOINTS.INTERNAL.HABITACIONES, tone: 'bg-sky-600' },
  { label: 'Pagos', endpoint: ENDPOINTS.INTERNAL.PAGOS, tone: 'bg-emerald-600' },
  { label: 'Valoraciones', endpoint: ENDPOINTS.INTERNAL.VALORACIONES, tone: 'bg-amber-600' },
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
    <div>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Resumen</p>
        <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(loading ? cards.map((card) => ({ ...card, total: '...' })) : summary).map((card) => (
          <article key={card.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className={`mb-4 h-2 w-14 rounded-full ${card.tone}`} />
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold">{card.total}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
