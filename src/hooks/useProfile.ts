import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'

export interface UserProfile {
  user_id: string
  user_name: string | null
  bio: string | null
  /** ISO date in YYYY-MM-DD format, or null if not provided. */
  birthday: string | null
  sports: string[]
  rating: number | null
  /** Storage path of the user's first gallery photo (lowest position), or null. */
  first_photo_path: string | null
  /**
   * ISO timestamp of when the user's Pulse Premium subscription expires.
   * `null` means they have never subscribed. A timestamp in the past means
   * they have lapsed. `> now()` means they are actively premium.
   */
  premium_expires_at: string | null
  created_at: string
  updated_at: string
}

interface ProfileResponse {
  data: UserProfile | null
}

/**
 * Fetches the authenticated user's profile from user_details.
 * `profile === null`      → row exists but has no data (shouldn't happen after setup)
 * `profile === undefined` → not yet loaded
 */
export function useProfile() {
  const { session } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    if (!session?.access_token) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    apiFetch<ProfileResponse>('/users/me', session.access_token)
      .then(({ data }) => setProfile(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [session?.access_token])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { profile, loading, error, refresh }
}
