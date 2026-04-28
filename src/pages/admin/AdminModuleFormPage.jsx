import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { adminApi } from '../../api/adminApi'
import { adminModules } from '../../data/adminModules'
import { buildFormFromRow, buildInitialForm, coercePayload, getFieldLabel, getOptionLabel, getOptionValue, readValue } from '../../utils/adminModule'
import { showError, showSuccess } from '../../utils/sweetAlert'
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload'

export default function AdminModuleFormPage() {
  const { moduleKey, recordId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const module = adminModules[moduleKey]
  const isEdit = Boolean(recordId)
  const initialRow = location.state?.row
  const [form, setForm] = useState(() => initialRow && module ? buildFormFromRow(module, initialRow) : buildInitialForm(module || {}))
  const [loading, setLoading] = useState(isEdit && !initialRow)
  const [relationOptions, setRelationOptions] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [imageFiles, setImageFiles] = useState({})
  const [imagePreviews, setImagePreviews] = useState({})
  const previewUrlsRef = useRef({})
  const { upload, uploading, uploadError } = useCloudinaryUpload()

  const title = useMemo(() => {
    if (!module) return 'Modulo no encontrado'
    return `${isEdit ? 'Editar' : 'Crear'} ${module.title}`
  }, [isEdit, module])
  const relationFields = useMemo(() => module?.fields?.filter((field) => field.type === 'relation') || [], [module])
  const loadingRelations = relationFields.some((field) => !relationOptions[field.name])

  useEffect(() => {
    const previewUrls = previewUrlsRef.current
    return () => {
      Object.values(previewUrls).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  useEffect(() => {
    if (!module || module.readonly || !isEdit || initialRow) return

    let alive = true
    adminApi.get(module.endpoint, recordId)
      .then((data) => {
        if (alive) setForm(buildFormFromRow(module, data))
      })
      .catch(() => {
        if (alive) setError('No se pudo cargar el registro para editar.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [initialRow, isEdit, module, recordId])

  useEffect(() => {
    if (relationFields.length === 0) return

    let alive = true
    Promise.all(
      relationFields.map((field) =>
        adminApi.list(field.endpoint)
          .then((items) => {
            const options = items.map((item) => {
              const value = field.valueKeys.map((key) => readValue(item, key)).find((itemValue) => itemValue !== '')
              const labelParts = field.labelKeys.map((key) => readValue(item, key)).filter(Boolean)
              return {
                value,
                label: labelParts.length ? labelParts.join(' - ') : String(value),
              }
            }).filter((option) => option.value !== undefined && option.value !== null && option.value !== '')
            return [field.name, options]
          })
          .catch(() => [field.name, []]),
      ),
    )
      .then((entries) => {
        if (alive) setRelationOptions(Object.fromEntries(entries))
      })

    return () => {
      alive = false
    }
  }, [relationFields])

  if (!module) {
    return <div className="rounded-lg bg-white p-6 dark:bg-slate-900">Modulo no encontrado.</div>
  }

  if (module.readonly) {
    return (
      <div className="rounded-lg bg-white p-6 dark:bg-slate-900">
        <p>Este modulo es solo de lectura.</p>
        <Link to={`/admin/${moduleKey}`} className="mt-4 inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
          Volver
        </Link>
      </div>
    )
  }

  const updateForm = (event) => {
    const { name, value, type, checked, multiple, selectedOptions } = event.target
    if (multiple) {
      const values = Array.from(selectedOptions).map((opt) => opt.value)
      setForm((current) => ({ ...current, [name]: values }))
    } else {
      setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    }
  }

  const handleFileChange = (fieldName, event) => {
    const file = event.target.files[0]
    if (!file) return

    if (previewUrlsRef.current[fieldName]) {
      URL.revokeObjectURL(previewUrlsRef.current[fieldName])
    }

    const previewUrl = URL.createObjectURL(file)
    previewUrlsRef.current[fieldName] = previewUrl

    setImageFiles((prev) => ({ ...prev, [fieldName]: file }))
    setImagePreviews((prev) => ({ ...prev, [fieldName]: previewUrl }))
  }

  const renderField = (field) => {
    if (field.type === 'select') {
      return (
        <select name={field.name} required={field.required} value={form[field.name] ?? ''} onChange={updateForm} className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
          {!field.required && <option value="">Sin seleccionar</option>}
          {field.options.map((option) => (
            <option key={getOptionValue(option)} value={getOptionValue(option)}>
              {getOptionLabel(option)}
            </option>
          ))}
        </select>
      )
    }

    if (field.type === 'relation') {
      const options = relationOptions[field.name] || []
      const value = form[field.name] ?? (field.multiple ? [] : '')
      return (
        <select multiple={field.multiple} name={field.name} required={field.required && (!field.multiple || value.length === 0)} disabled={loadingRelations} value={value} onChange={updateForm} className="rounded-md border border-slate-300 px-3 py-2 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950">
          {!field.multiple && <option value="">{loadingRelations ? 'Cargando opciones...' : 'Selecciona una opcion'}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      )
    }

    if (field.type === 'checkbox') {
      return <input name={field.name} type="checkbox" checked={Boolean(form[field.name])} onChange={updateForm} className="h-5 w-5" />
    }

    if (field.type === 'image') {
      const preview = imagePreviews[field.name]
      const existingUrl = form[field.name]
      return (
        <div className="flex flex-col gap-2">
          <input
            id={`file-${field.name}`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFileChange(field.name, e)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-indigo-50 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 dark:border-slate-700 dark:bg-slate-950"
          />
          {(preview || existingUrl) && (
            <img
              src={preview || existingUrl}
              alt="Preview"
              className="h-32 w-48 rounded-md border border-slate-200 object-cover dark:border-slate-700"
            />
          )}
        </div>
      )
    }

    return (
      <input name={field.name} type={field.type} step={field.step} required={field.required} value={form[field.name] ?? ''} onChange={updateForm} className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
    )
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      let enrichedForm = { ...form }
      const requiredError = (module.fields || []).find((field) => {
        if (!field.required) return false
        if (field.type === 'checkbox' || field.type === 'image') return false
        const value = enrichedForm[field.name]
        if (field.multiple) return !Array.isArray(value) || value.length === 0
        return value === undefined || value === null || String(value).trim() === ''
      })

      if (requiredError) {
        const message = `El campo "${getFieldLabel(requiredError)}" es obligatorio.`
        setError(message)
        await showError('Formulario incompleto', message)
        setSaving(false)
        return
      }

      const invalidNumber = (module.fields || []).find((field) => {
        if (!['number'].includes(field.type)) return false
        const value = enrichedForm[field.name]
        return value !== undefined && value !== null && String(value).trim() !== '' && Number.isNaN(Number(value))
      })

      if (invalidNumber) {
        const message = `El campo "${getFieldLabel(invalidNumber)}" debe ser numerico.`
        setError(message)
        await showError('Dato invalido', message)
        setSaving(false)
        return
      }

      const imageFields = (module.fields || []).filter((f) => f.type === 'image')
      for (const field of imageFields) {
        const file = imageFiles[field.name]
        const existingUrl = form[field.name]

        // Validación: Si el campo es requerido y no hay archivo nuevo ni URL existente
        if (field.required && !file && !existingUrl) {
          setError(`La imagen para el campo "${field.name}" es obligatoria.`)
          setSaving(false)
          return
        }

        if (file) {
          try {
            const url = await upload(file)
            enrichedForm[field.name] = url
          } catch (err) {
            setError(err.message)
            setSaving(false)
            return
          }
        }
      }

      const payload = coercePayload(enrichedForm, module, isEdit ? 'update' : 'create')
      if (isEdit) await adminApi.update(module.endpoint, recordId, payload)
      else await adminApi.create(module.endpoint, payload)
      await showSuccess(
        isEdit ? 'Registro actualizado' : 'Registro creado',
        isEdit ? 'Los cambios se guardaron correctamente.' : 'El nuevo registro se creo correctamente.',
      )
      navigate(`/admin/${moduleKey}`, { replace: true })
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'No se pudo guardar el registro.'
      setError(message)
      await showError('No se pudo guardar', message)
    } finally {
      setSaving(false)
    }
  }

  const isBusy = saving || uploading

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Formulario</p>
          <h1 className="mt-2 text-3xl font-bold">{title}</h1>
        </div>
        <Link to={`/admin/${moduleKey}`} className="inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">
          Volver
        </Link>
      </div>

      {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {uploadError && !error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{uploadError}</div>}
      {uploading && <div className="rounded-md bg-indigo-50 px-4 py-3 text-sm text-indigo-700">Subiendo imagen a Cloudinary...</div>}

      {loading ? (
        <div className="rounded-lg bg-white p-8 text-center text-slate-500 dark:bg-slate-900">Cargando registro...</div>
      ) : (
        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {module.fields.map((field) => (
              <label key={field.name} className="flex flex-col gap-1 text-sm">
                <span className="font-medium">{getFieldLabel(field)}</span>
                {renderField(field)}
              </label>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <button disabled={isBusy} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60">
              {uploading ? 'Subiendo imagen...' : saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
            </button>
            <Link to={`/admin/${moduleKey}`} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
