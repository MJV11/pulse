import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import type { StravaSportStat } from '../lib/types'

/** How a user identifies themselves. */
export type Gender = 'man' | 'woman' | 'nonbinary'

/** Who a user is interested in seeing in their discovery feed. */
export type LookingFor = 'man' | 'woman' | 'nonbinary' | 'all'

export interface UserProfile {
  user_id: string
  user_name: string | null
  bio: string | null
  /** ISO date in YYYY-MM-DD format, or null if not provided. */
  birthday: string | null
  sports: string[]
  rating: number | null
  /** The user's own gender, or null if they haven't set one yet. */
  gender: Gender | null
  /** Who the user wants to see in discovery, or null if unset. */
  looking_for: LookingFor | null
  /** Minimum age the user wants to see in discovery (defaults to 18). */
  min_age_pref: number
  /** Maximum age the user wants to see in discovery (defaults to 99). */
  max_age_pref: number
  /** Minimum FTP (watts) the user wants to see in discovery (defaults to 50). */
  min_ftp_pref: number
  /** Maximum FTP (watts) the user wants to see in discovery (defaults to 500). */
  max_ftp_pref: number
  /**
   * When true, discovery hides users without a known Strava FTP. When false,
   * unknown-FTP users are still shown and only known-out-of-range FTPs are
   * filtered out.
   */
  require_ftp: boolean
  /** Storage path of the user's first gallery photo (lowest position), or null. */
  first_photo_path: string | null
  /**
   * ISO timestamp of when the user's Pulse Premium subscription expires.
   * `null` means they have never subscribed. A timestamp in the past means
   * they have lapsed. `> now()` means they are actively premium.
   */
  premium_expires_at: string | null
  /**
   * Effective FTP in watts — the higher of the Strava-reported FTP and the
   * user's self-reported FTP. `null` when neither source has a value.
   */
  strava_ftp: number | null
  /** User self-reported FTP in watts, or null if not set. */
  ftp: number | null
  /** User self-reported mile run pace in seconds (e.g. 360 = 6:00/mi), or null. */
  mile_pace_seconds: number | null
  /** User self-reported 100-yard freestyle pace in seconds (e.g. 90 = 1:30/100yd), or null. */
  swim_pace_seconds: number | null
  /** ISO timestamp of the last successful Strava stats sync, or null. */
  strava_synced_at: string | null
  /**
   * 14-day rolling per-sport-type activity stats. Empty array when Strava
   * isn't connected or the user hasn't logged anything in the window.
   */
  strava_stats: StravaSportStat[]
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
