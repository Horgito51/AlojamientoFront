import api from './axiosConfig'
import { normalizeEntity, normalizeList } from './normalize'

export const adminApi = {
  async list(endpoint, params = {}) {
    const { data } = await api.get(endpoint.base ?? endpoint, { params })
    return normalizeList(data)
  },

  async get(endpoint, id) {
    const url = endpoint.byId ? endpoint.byId(id) : `${endpoint.base}/${id}`
    const { data } = await api.get(url)
    return normalizeEntity(data)
  },

  async create(endpoint, payload) {
    const { data } = await api.post(endpoint.base ?? endpoint, payload)
    return normalizeEntity(data)
  },

  async update(endpoint, id, payload) {
    const url = endpoint.byId ? endpoint.byId(id) : `${endpoint.base}/${id}`
    const { data } = await api.put(url, payload)
    return normalizeEntity(data)
  },

  async remove(endpoint, id) {
    const url = endpoint.byId ? endpoint.byId(id) : `${endpoint.base}/${id}`
    await api.delete(url)
  },

  async patch(url, payload = {}) {
    const { data } = await api.patch(url, payload)
    return normalizeEntity(data)
  },

  async post(url, payload = {}) {
    const { data } = await api.post(url, payload)
    return normalizeEntity(data)
  },
}
