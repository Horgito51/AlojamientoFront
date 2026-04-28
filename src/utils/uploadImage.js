const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dug2avwlq/image/upload'
const UPLOAD_PRESET = 'alojamiento'

export const uploadImage = async (file) => {
  if (!file) throw new Error('No se proporcionó un archivo.')

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)

  const response = await fetch(CLOUDINARY_URL, {
    method: 'POST',
    body: formData,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Error al subir la imagen a Cloudinary.')
  }

  return data.secure_url
}
