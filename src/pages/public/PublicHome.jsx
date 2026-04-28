import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { bookingApi } from '../../api/bookingApi'
import RoomCard from '../../components/common/RoomCard'
import banner from '../../assets/images/banner.png'
import hotelImg from '../../assets/images/hotelJJ.png'

export default function PublicHome() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    bookingApi.search('')
      .then((items) => {
        if (alive) {
          // Filtrar solo las que tengan imagen o datos validos si es necesario, 
          // pero aqui simplemente tomamos las primeras 3 reales
          setRooms(items.slice(0, 3))
        }
      })
      .catch((err) => {
        console.error('Error fetching rooms:', err)
        if (alive) setRooms([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  return (
    <main className="bg-slate-50 dark:bg-slate-950">
      {/* Hero Section */}
      <section className="relative h-[600px] w-full overflow-hidden">
        <img
          src={banner}
          alt="Alojamiento JJ Banner"
          className="absolute inset-0 h-full w-full object-cover brightness-50"
        />
        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-4 text-center text-white sm:px-6 lg:px-8">
          <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl">
            Tu refugio perfecto en el corazón de Cuenca
          </h1>
          <p className="mt-6 max-w-2xl text-xl text-slate-200">
            Disfruta de la mejor experiencia de hospedaje con nosotros. Comodidad, elegancia y atención personalizada.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/habitaciones"
              className="rounded-full bg-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-indigo-500 active:scale-95"
            >
              Reservar Ahora
            </Link>
            <a
              href="#sobre-nosotros"
              className="rounded-full border-2 border-white bg-transparent px-8 py-4 text-lg font-bold text-white backdrop-blur-sm transition-all hover:bg-white hover:text-indigo-600"
            >
              Conócenos
            </a>
          </div>
        </div>
      </section>

      {/* Habitaciones Destacadas */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-center text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">Nuestras Joyas</p>
          <h2 className="mt-2 text-4xl font-bold text-slate-900 dark:text-white sm:text-5xl">Habitaciones Disponibles</h2>
          <div className="mt-4 h-1.5 w-20 rounded-full bg-indigo-600" />
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : rooms.length > 0 ? (
          <>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <RoomCard key={room.idHabitacion || room.id} room={room} />
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link to="/habitaciones" className="inline-flex items-center gap-2 font-bold text-indigo-600 hover:text-indigo-500">
                Ver todas las habitaciones
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xl text-slate-500">No hay habitaciones disponibles en este momento.</p>
            <Link to="/habitaciones" className="mt-4 inline-block text-indigo-600 underline">Consultar todas las fechas</Link>
          </div>
        )}
      </section>

      {/* Sobre Nosotros Section */}
      <section id="sobre-nosotros" className="bg-white py-24 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="relative group">
              <div className="absolute -inset-4 rounded-2xl bg-indigo-600/10 blur-xl transition-all group-hover:bg-indigo-600/20" />
              <img
                src={hotelImg}
                alt="Nuestro Hotel"
                className="relative rounded-2xl shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="absolute -bottom-6 -right-6 hidden h-32 w-32 rounded-2xl bg-indigo-600 p-4 shadow-xl sm:block">
                <div className="flex h-full flex-col items-center justify-center text-center text-white">
                  <span className="text-3xl font-bold">10+</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Años de Excelencia</span>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">Quiénes Somos</p>
                <h2 className="mt-2 text-4xl font-bold text-slate-900 dark:text-white sm:text-5xl">Alojamiento JJ</h2>
              </div>
              
              <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                Alojamiento JJ es un emprendimiento familiar nacido con el deseo de ofrecer un hogar lejos de casa. 
                Ubicados en el corazón de Cuenca, nos enfocamos en brindar una experiencia personalizada que 
                combine la modernidad de nuestras instalaciones con la calidez tradicional de nuestra tierra.
              </p>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-6 transition-colors hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/30">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Nuestra Misión</h3>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                    Brindar un servicio de alojamiento excepcional en la ciudad de Cuenca, combinando confort, 
                    hospitalidad y tecnología para superar las expectativas de nuestros huéspedes.
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-6 transition-colors hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/30">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Nuestra Visión</h3>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                    Ser el referente de hospitalidad en el Austro ecuatoriano, reconocidos por nuestra calidez 
                    humana, excelencia en el servicio y compromiso con el bienestar de quienes nos visitan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
