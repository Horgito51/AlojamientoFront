import api from './axiosConfig'
import { ENDPOINTS } from './endpoints'
import { normalizeEntity, normalizeList } from './normalize'

export const bookingApi = {
  async search(query = 'habitacion') {
    const searchQuery = query?.trim() || 'habitacion'
    const { data } = await api.get(`${ENDPOINTS.PUBLIC.ACCOMMODATIONS}/search`, {
      params: { query: searchQuery },
    })
    return normalizeList(data)
  },

  async getAccommodation(id) {
    const { data } = await api.get(`${ENDPOINTS.PUBLIC.ACCOMMODATIONS}/${id}`)
    return normalizeEntity(data)
  },

  async getCategories() {
    const { data } = await api.get(`${ENDPOINTS.PUBLIC.ACCOMMODATIONS}/categories`)
    return normalizeList(data)
  },

  async getReviews(id) {
    const { data } = await api.get(`${ENDPOINTS.PUBLIC.ACCOMMODATIONS}/${id}/reviews`)
    return normalizeList(data)
  },
}
