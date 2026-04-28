import { useParams } from 'react-router-dom'
import AdminModulePage from './AdminModulePage'

export default function AdminModuleRoute() {
  const { moduleKey } = useParams()
  return <AdminModulePage key={moduleKey} />
}
