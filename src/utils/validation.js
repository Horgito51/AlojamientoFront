export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
export const PHONE_10_REGEX = /^\d{10}$/

const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '')

export const isValidEcuadorCedula = (value) => {
  const cedula = onlyDigits(value)
  if (!/^\d{10}$/.test(cedula)) return false

  const province = Number(cedula.slice(0, 2))
  const thirdDigit = Number(cedula[2])
  if (province < 1 || province > 24 || thirdDigit > 5) return false

  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2]
  const total = coefficients.reduce((sum, coefficient, index) => {
    const product = Number(cedula[index]) * coefficient
    return sum + (product >= 10 ? product - 9 : product)
  }, 0)
  const verifier = total % 10 === 0 ? 0 : 10 - (total % 10)
  return verifier === Number(cedula[9])
}

const validateModulo11 = (digits, coefficients, verifierIndex) => {
  const sum = coefficients.reduce((acc, coefficient, index) => acc + Number(digits[index]) * coefficient, 0)
  const remainder = sum % 11
  const verifier = remainder === 0 ? 0 : 11 - remainder
  return verifier === Number(digits[verifierIndex])
}

export const isValidEcuadorRuc = (value) => {
  const ruc = onlyDigits(value)
  if (!/^\d{13}$/.test(ruc) || ruc.slice(10) === '000') return false

  const thirdDigit = Number(ruc[2])
  if (thirdDigit <= 5) return isValidEcuadorCedula(ruc.slice(0, 10))
  if (thirdDigit === 6) return validateModulo11(ruc, [3, 2, 7, 6, 5, 4, 3, 2], 8)
  if (thirdDigit === 9) return validateModulo11(ruc, [4, 3, 2, 7, 6, 5, 4, 3, 2], 9)
  return false
}

export const isAdult = (value, minimumAge = 18) => {
  if (!value) return true
  const birthDate = new Date(`${value}T00:00:00`)
  if (Number.isNaN(birthDate.getTime())) return false

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1
  return age >= minimumAge
}

export const isReservableRoomState = (state) => {
  const value = String(state ?? 'DIS').trim().toUpperCase()
  return value === 'DIS' || value === 'ACT'
}

export const validateEcuadorIdentification = (type, value) => {
  const normalizedType = String(type ?? '').trim().toUpperCase()
  if (['CED', 'CEDULA', 'C'].includes(normalizedType)) {
    return isValidEcuadorCedula(value) ? '' : 'La cedula ecuatoriana no es valida.'
  }
  if (normalizedType === 'RUC') {
    return isValidEcuadorRuc(value) ? '' : 'El RUC ecuatoriano no es valido.'
  }
  return ''
}
