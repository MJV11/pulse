import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import type { StravaSportStat } from '../lib/types'

/**
 * Shape returned for each match's user. The server selects everything from
 * `user_details` (minus the geography blob) and adds `first_photo_path`, so
 * any new column on `user_details` will flow through without changes here.
 *
 * Strava data (`strava_ftp`, `strava_stats`) is enriched in by the API so
 * the discovery-style profile modal renders the same FTP + 14d stats panel
 * here as it does in the discovery feed.
 */
export interface MatchedUser {
  user_id: string
  user_name: string | null
  bio: string | null
  birthday: string | null
  sports: string[]
  rating: number | null
  first_photo_path: string | null
  strava_ftp: number | null
  strava_stats: StravaSportStat[]
  [key: string]: unknown
}

export interface MatchItem {
  match_id: string
  matched_at: string
  user: MatchedUser
}

interface MatchesResponse {
  data: MatchItem[]
}

export function useMatches() {
  const { session } = useAuth()
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.access_token) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    apiFetch<MatchesResponse>('/matches', session.access_token)
      .then(({ data }) => {
        if (!cancelled) setMatches(data ?? [])
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
  }, [session?.access_token])

  /**
   * Unmatches the current user from `userId`. Optimistically drops the row
   * from local state and rolls back if the API call fails so the UI stays
   * in sync without waiting for a refetch.
   */
  const unmatch = useCallback(
    async (userId: string) => {
      if (!session?.access_token) return
      const previous = matches
      setMatches((prev) => prev.filter((m) => m.user.user_id !== userId))
      try {
        await apiFetch(`/matches/${userId}`, session.access_token, {
          method: 'DELETE',
        })
      } catch (err) {
        console.error('Failed to unmatch:', err)
        setMatches(previous)
        throw err
      }
    },
    [session?.access_token, matches],
  )

  return { matches, loading, error, unmatch }
}
