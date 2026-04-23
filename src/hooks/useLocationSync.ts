import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'

/**
 * Silently requests the user's geolocation once per session and posts it to
 * PUT /api/users/location so discovery queries are scoped correctly.
 *
 * - Runs only when a session exists.
 * - Uses a ref flag so it fires at most once per page load, not on every render.
 * - Swallows location permission denials gracefully — the app still works,
 *   discovery will just return an empty result until a location is stored.
 */
export function useLocationSync() {
  const { session } = useAuth()
  const syncedRef = useRef(false)

  useEffect(() => {
    if (!session?.access_token || syncedRef.current) return
    if (!navigator.geolocation) return

    syncedRef.current = true

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        apiFetch('/users/location', session.access_token, {
          method: 'PUT',
          body: JSON.stringify({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        }).catch((err) => console.warn('Location sync failed:', err))
      },
      (err) => console.warn('Location permission denied or unavailable:', err.message),
      { timeout: 10_000, maximumAge: 5 * 60 * 1000 }, // accept a 5-min cached fix
    )
  }, [session?.access_token])
}
