import { useState } from 'react'
import { uploadImage } from '../utils/uploadImage'

export const useCloudinaryUpload = () => {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const upload = async (file) => {
    setUploadError('')
    setUploading(true)
    try {
      const url = await uploadImage(file)
      return url
    } catch (err) {
      const msg = err.message || 'Error al subir la imagen.'
      setUploadError(msg)
      throw err
    } finally {
      setUploading(false)
    }
  }

  return { upload, uploading, uploadError }
}
