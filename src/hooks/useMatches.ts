import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'

export interface MatchedUser {
  user_id: string
  user_name: string | null
  bio: string | null
  sports: string[]
  rating: number | null
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

  return { matches, loading, error }
}
