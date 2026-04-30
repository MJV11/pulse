import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import type { StravaSportStat } from '../lib/types'

/**
 * Shape returned by `GET /api/discovery`. The server flattens the full
 * `user_details` row (minus the geography blob) plus a couple of computed
 * scalars, so any new column added to `user_details` will flow through
 * automatically — feel free to read additional fields directly off this
 * object even if they aren't listed here.
 *
 * Strava data (`strava_ftp`, `strava_stats`) is merged in by the
 * `nearby_users` SQL function so the client doesn't need a second round-trip.
 */
export interface NearbyUser {
  user_id: string
  user_name: string | null
  bio: string | null
  birthday: string | null
  sports: string[]
  rating: number | null
  gender: 'man' | 'woman' | 'nonbinary' | null
  looking_for: 'man' | 'woman' | 'nonbinary' | 'all' | null
  first_photo_path: string | null
  distance_miles: number
  /** Self-reported FTP from the candidate's Strava profile, or null. */
  strava_ftp: number | null
  /** 14-day per-sport-type activity stats. Empty array when no Strava data. */
  strava_stats: StravaSportStat[]
  // Forward-compatibility escape hatch for newly added user_details columns
  [key: string]: unknown
}

interface DiscoveryResponse {
  data: NearbyUser[]
  reason?: 'no_location'
}

/**
 * Fetches users near the authenticated user within the given mile radius.
 * Returns `noLocation: true` when the current user hasn't shared their
 * location yet so the UI can prompt them accordingly.
 */
export function useDiscovery(radiusMiles = 50) {
  const { session } = useAuth()
  const [users, setUsers] = useState<NearbyUser[]>([])
  const [loading, setLoading] = useState(true)
  const [noLocation, setNoLocation] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.access_token) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    apiFetch<DiscoveryResponse>(
      `/discovery?miles=${radiusMiles}`,
      session.access_token,
    )
      .then(({ data, reason }) => {
        if (cancelled) return
        setNoLocation(reason === 'no_location')
        setUsers(data ?? [])
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [session?.access_token, radiusMiles])

  return { users, loading, noLocation, error }
}
