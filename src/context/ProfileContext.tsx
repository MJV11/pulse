import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { apiFetch } from '../lib/api'
import { SetupProfileFlow } from '../components/profile/SetupProfileFlow'
import type { UserProfile } from '../hooks/useProfile'

interface ProfileContextValue {
  profile: UserProfile | null
  profileLoading: boolean
  refreshProfile: () => void
  /**
   * Whether the authenticated user currently has Pulse Premium.
   * Derived from `profile.premium_expires_at` — true iff a row exists in
   * `premium_users` with `expires_at` strictly in the future.
   */
  isPremium: boolean
  /** ISO timestamp of when premium expires, or `null` if never subscribed. */
  premiumExpiresAt: string | null
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined)
  const [profileLoading, setProfileLoading] = useState(true)

  const fetchProfile = useCallback(() => {
    if (!session?.access_token) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)
    apiFetch<{ data: UserProfile | null }>('/users/me', session.access_token)
      .then(({ data }) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false))
  }, [session?.access_token])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Once per signed-in user, ask the backend to refresh Strava stats. The
  // backend throttles to once per hour, so re-running this on a quick
  // reload is a cheap no-op. Fire-and-forget — we never want this to block
  // the UI; stale stats are fine until the next sync lands and the next
  // /users/me call returns the updated row.
  const lastSyncedUserRef = useRef<string | null>(null)
  useEffect(() => {
    if (!session?.access_token) return
    const userId = session.user.id
    if (lastSyncedUserRef.current === userId) return
    lastSyncedUserRef.current = userId

    apiFetch<{ data: { refreshed: boolean } }>(
      '/strava/sync',
      session.access_token,
      { method: 'POST' },
    )
      .then(({ data }) => {
        if (data?.refreshed) fetchProfile()
      })
      .catch((err) => {
        console.warn('Background Strava sync failed:', err)
      })
  }, [session?.access_token, session?.user.id, fetchProfile])

  const needsSetup =
    !profileLoading &&
    session &&
    (profile === null || !profile?.user_name)

  const { isPremium, premiumExpiresAt } = useMemo(() => {
    const expires = profile?.premium_expires_at ?? null
    if (!expires) return { isPremium: false, premiumExpiresAt: null }
    const expiresMs = Date.parse(expires)
    const active = Number.isFinite(expiresMs) && expiresMs > Date.now()
    return { isPremium: active, premiumExpiresAt: expires }
  }, [profile?.premium_expires_at])

  return (
    <ProfileContext.Provider
      value={{
        profile: profile ?? null,
        profileLoading,
        refreshProfile: fetchProfile,
        isPremium,
        premiumExpiresAt,
      }}
    >
      {children}

      {needsSetup && (
        <SetupProfileFlow
          mode="setup"
          onComplete={(completed) => setProfile(completed)}
        />
      )}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used inside <ProfileProvider>')
  return ctx
}
