import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'

export interface NearbyUser {
  user_id: string
  user_name: string | null
  bio: string | null
  sports: string[]
  rating: number | null
  first_photo_path: string | null
  distance_miles: number
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
