/**
 * Helpers for converting between birthdays and displayed age.
 *
 * Birthdays are stored as ISO `YYYY-MM-DD` strings (matching Postgres `date`).
 */

/** Computes the user's age in completed years from a YYYY-MM-DD birthday string. */
export function calculateAge(birthday: string | null | undefined): number | null {
  if (!birthday) return null
  const parts = birthday.split('-')
  if (parts.length !== 3) return null
  const [y, m, d] = parts.map((p) => Number(p))
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null

  const today = new Date()
  let age = today.getFullYear() - y
  const monthDiff = today.getMonth() + 1 - m
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) {
    age -= 1
  }
  return age >= 0 ? age : null
}

/** Minimum age allowed for a Pulse account. */
export const MIN_AGE = 18

/** YYYY-MM-DD for the latest birthday a user is allowed to enter. */
export function maxBirthdayForMinAge(minAge: number = MIN_AGE): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - minAge)
  return d.toISOString().slice(0, 10)
}

/** YYYY-MM-DD for the earliest plausible birthday (120 years ago). */
export function minBirthday(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 120)
  return d.toISOString().slice(0, 10)
}
