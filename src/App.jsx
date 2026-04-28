import { Navigate, Route, Routes } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'
import ProtectedRoute from './routes/ProtectedRoute'
import Login from './components/Login'
import Register from './components/Register'
import PublicHome from './pages/public/PublicHome'
import MarketplacePage from './pages/marketplace/MarketplacePage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminModuleRoute from './pages/admin/AdminModuleRoute'
import AdminModuleFormPage from './pages/admin/AdminModuleFormPage'
import ReservaFormPage from './pages/admin/ReservaFormPage'

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<PublicHome />} />
        <Route path="habitaciones" element={<MarketplacePage />} />
        <Route path="reserva" element={<MarketplacePage />} />
      </Route>

      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />

      <Route path="admin" element={<ProtectedRoute allowedRoles={['ADMINISTRADOR', 'ADMIN', 'OPERATIVO', 'DESK_SERVICE']} />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          {/* Rutas específicas de reservas (formulario dedicado con cálculo automático) */}
          <Route path="reservas/nuevo" element={<ReservaFormPage />} />
          {/* Rutas genéricas para los demás módulos */}
          <Route path=":moduleKey/nuevo" element={<AdminModuleFormPage />} />
          <Route path=":moduleKey/:recordId/editar" element={<AdminModuleFormPage />} />
          <Route path=":moduleKey" element={<AdminModuleRoute />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
