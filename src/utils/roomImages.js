const directImageFields = [
  'imagenUrl',
  'ImagenUrl',
  'imagenURL',
  'imageUrl',
  'url',
  'Url',
  'urlImagen',
  'fotoUrl',
  'imagen',
  'image',
  'foto',
]

const nestedImageFields = [
  'habitacion',
  'tipoHabitacion',
  'tipo',
  'sucursal',
  'accommodation',
]

const isRemoteImageUrl = (value) => {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  return /^https?:\/\//i.test(trimmed)
}

export const getRoomImageUrl = (room) => {
  if (!room) return null

  for (const field of directImageFields) {
    const value = room[field]
    if (isRemoteImageUrl(value)) return value.trim()
  }

  for (const field of nestedImageFields) {
    const nested = room[field]
    if (!nested || typeof nested !== 'object') continue

    for (const imageField of directImageFields) {
      const value = nested[imageField]
      if (isRemoteImageUrl(value)) return value.trim()
    }
  }

  return null
}
