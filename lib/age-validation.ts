export const MINIMUM_MEMBER_AGE = 15
export const MAXIMUM_MEMBER_AGE = 120

export function maximumDateOfBirth(today = new Date()) {
  const date = new Date(today)
  date.setFullYear(date.getFullYear() - MINIMUM_MEMBER_AGE)
  return formatDate(date)
}

export function minimumDateOfBirth(today = new Date()) {
  const date = new Date(today)
  date.setFullYear(date.getFullYear() - MAXIMUM_MEMBER_AGE)
  return formatDate(date)
}

function formatDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}

export function getAge(dateOfBirth: string, today = new Date()) {
  const birth = new Date(`${dateOfBirth}T00:00:00`)
  if (Number.isNaN(birth.getTime())) return null
  let age = today.getFullYear() - birth.getFullYear()
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  if (beforeBirthday) age -= 1
  return age
}

export function validateMemberDateOfBirth(dateOfBirth: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return "Enter a valid date of birth."
  const age = getAge(dateOfBirth)
  if (age === null || age < MINIMUM_MEMBER_AGE) {
    return "You must be at least 15 years old to register. If you are younger, please ask a parent or guardian to contact the church."
  }
  if (age > MAXIMUM_MEMBER_AGE) return "Enter a valid date of birth."
  return null
}
