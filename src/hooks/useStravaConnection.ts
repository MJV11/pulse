import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'

export interface StravaAthlete {
  id: number
  username: string | null
  firstname: string | null
  lastname: string | null
  profile: string | null
}

export interface StravaConnectionStatus {
  connected: boolean
  connected_at: string | null
  scope: string | null
  athlete: StravaAthlete | null
}

interface StatusResponse {
  data: StravaConnectionStatus
}

/**
 * Reads the authenticated user's Strava connection status from the API and
 * exposes a `disconnect` action. Connection persists across logins because
 * it lives in the `strava_connections` table on the server.
 */
export function useStravaConnection() {
  const { session } = useAuth()
  const [status, setStatus] = useState<StravaConnectionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!session?.access_token) {
      setStatus(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data } = await apiFetch<StatusResponse>(
        '/strava/status',
        session.access_token,
      )
      setStatus(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    refresh()
  }, [refresh])

  const disconnect = useCallback(async () => {
    if (!session?.access_token) return
    await apiFetch('/strava/disconnect', session.access_token, { method: 'DELETE' })
    await refresh()
  }, [session?.access_token, refresh])

  return { status, loading, error, refresh, disconnect }
}
