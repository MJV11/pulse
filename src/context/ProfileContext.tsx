import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { apiFetch } from '../lib/api'
import { SetupProfileFlow } from '../components/profile/SetupProfileFlow'
import type { UserProfile } from '../hooks/useProfile'

interface ProfileContextValue {
  profile: UserProfile | null
  profileLoading: boolean
  refreshProfile: () => void
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

  const needsSetup =
    !profileLoading &&
    session &&
    (profile === null || !profile?.user_name)

  return (
    <ProfileContext.Provider
      value={{
        profile: profile ?? null,
        profileLoading,
        refreshProfile: fetchProfile,
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
