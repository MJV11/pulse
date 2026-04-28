/**
 * Time formatting helpers, all explicitly rendered in the viewer's *local*
 * timezone. The backend stores `timestamptz` columns in UTC and PostgREST
 * returns them as ISO 8601 strings with a timezone offset, e.g.
 * `2026-04-28T17:42:00+00:00`. `new Date(iso)` parses these correctly into a
 * UTC instant; `toLocaleString` and friends then render in the browser's
 * IANA timezone.
 *
 * Centralising formatting here means every "10:42 AM" / "Today" / "5m" you
 * see in the app comes from the same code path and the same timezone rules.
 */

/** Returns the viewer's IANA timezone name (e.g. `"America/Los_Angeles"`). */
export function getLocalTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Time-of-day in the viewer's local timezone.
 * Examples (en-US): `"10:42 AM"`, `"5:03 PM"`.
 * Locale follows the browser, so a viewer in France sees `"10:42"`.
 */
export function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Compact relative-or-absolute timestamp for conversation list rows.
 *   < 1 min  →  "now"
 *   < 1 hr   →  "12m"
 *   < 24 hr  →  "3h"
 *   < 7 days →  "5d"
 *   same yr  →  "Apr 22"
 *   older    →  "Apr 22, 2024"
 *
 * All boundaries are computed against the viewer's local clock.
 */
export function formatRelativeShort(iso: string, now: Date = new Date()): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''

  const diffMs = now.getTime() - d.getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`

  const sameYear = d.getFullYear() === now.getFullYear()
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

/**
 * Stable `YYYY-MM-DD` key for the moment, computed in the viewer's local
 * timezone. Useful for grouping messages into per-day buckets so the chat
 * window can show date separators that line up with the user's calendar
 * rather than UTC.
 */
export function localDateKey(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Localized day label for the date-separator pill in chat threads.
 *   today       →  "Today"
 *   yesterday   →  "Yesterday"
 *   < 7 days    →  weekday name in the viewer's locale, e.g. "Wednesday"
 *   same year   →  "Mon, Apr 22"
 *   older       →  "Mon, Apr 22, 2024"
 */
export function formatDateSeparator(iso: string, now: Date = new Date()): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''

  const startOfDay = (x: Date) => {
    const c = new Date(x)
    c.setHours(0, 0, 0, 0)
    return c
  }

  const today = startOfDay(now)
  const target = startOfDay(d)
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86_400_000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays > 1 && diffDays < 7) {
    return d.toLocaleDateString(undefined, { weekday: 'long' })
  }

  const sameYear = d.getFullYear() === now.getFullYear()
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}
