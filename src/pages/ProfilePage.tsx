import { useState } from 'react'
import { HeroSection } from '../components/profile/HeroSection'
import { AboutMeCard } from '../components/profile/AboutMeCard'
import { InterestsCard } from '../components/profile/InterestsCard'
import { MediaGallery } from '../components/profile/MediaGallery'
import { AccountSettings } from '../components/profile/AccountSettings'
import { StravaActivityPanel } from '../components/profile/StravaActivityPanel'
import { useProfile } from '../context/ProfileContext'
import { useAuth } from '../context/AuthContext'
import { useProfilePhotos } from '../hooks/useProfilePhotos'
import { apiFetch } from '../lib/api'
import type { Gender, LookingFor, UserProfile } from '../hooks/useProfile'

export function ProfilePage() {
  const { profile, profileLoading: loading, refreshProfile: refresh } = useProfile()
  const { session } = useAuth()
  const { photos, loading: photosLoading, addPhoto, removePhoto } = useProfilePhotos()

  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [draftName, setDraftName] = useState('')
  const [draftBio, setDraftBio] = useState('')
  const [draftBirthday, setDraftBirthday] = useState<string>('')
  const [draftSports, setDraftSports] = useState<string[]>([])
  const [draftGender, setDraftGender] = useState<Gender | null>(null)

  const userId = session?.user.id ?? ''

  function startEditing() {
    setDraftName(profile?.user_name ?? '')
    setDraftBio(profile?.bio ?? '')
    setDraftBirthday(profile?.birthday ?? '')
    setDraftSports(profile?.sports ?? [])
    setDraftGender(profile?.gender ?? null)
    setError(null)
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
    setError(null)
  }

  async function saveProfile() {
    if (!session?.access_token) return
    setSaving(true)
    setError(null)
    try {
      await apiFetch<{ data: UserProfile }>('/users/me', session.access_token, {
        method: 'PUT',
        body: JSON.stringify({
          user_name: draftName.trim() || null,
          bio: draftBio.trim() || null,
          birthday: draftBirthday || null,
          sports: draftSports,
          gender: draftGender,
        }),
      })
      await refresh()
      setIsEditing(false)
    } catch (err) {
      setError((err as Error).message ?? 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  /**
   * Persists a new looking-for preference. Lives outside the global edit-mode
   * because the AccountSettings submenu commits the change immediately.
   */
  async function saveLookingFor(next: LookingFor) {
    if (!session?.access_token) return
    setError(null)
    try {
      await apiFetch<{ data: UserProfile }>('/users/me', session.access_token, {
        method: 'PUT',
        body: JSON.stringify({ looking_for: next }),
      })
      await refresh()
    } catch (err) {
      setError((err as Error).message ?? 'Something went wrong')
    }
  }

  /** Persists updated age range preferences. Called on slider release. */
  async function saveAgePrefs(min: number, max: number) {
    if (!session?.access_token) return
    setError(null)
    try {
      await apiFetch<{ data: UserProfile }>('/users/me', session.access_token, {
        method: 'PUT',
        body: JSON.stringify({ min_age_pref: min, max_age_pref: max }),
      })
      await refresh()
    } catch (err) {
      setError((err as Error).message ?? 'Something went wrong')
    }
  }

  /**
   * Persists updated FTP range preferences. Called on slider release.
   * `requireFtp` is the toggle that hides users without a known FTP.
   */
  async function saveFtpPrefs(min: number, max: number, requireFtp: boolean) {
    if (!session?.access_token) return
    setError(null)
    try {
      await apiFetch<{ data: UserProfile }>('/users/me', session.access_token, {
        method: 'PUT',
        body: JSON.stringify({
          min_ftp_pref: min,
          max_ftp_pref: max,
          require_ftp: requireFtp,
        }),
      })
      await refresh()
    } catch (err) {
      setError((err as Error).message ?? 'Something went wrong')
    }
  }

  const displayName = isEditing ? draftName : (profile?.user_name ?? null)
  const displayBio = isEditing ? draftBio : (profile?.bio ?? null)
  const displayBirthday = isEditing ? draftBirthday : (profile?.birthday ?? null)
  const displaySports = isEditing ? draftSports : (profile?.sports ?? [])
  const displayGender = isEditing ? draftGender : (profile?.gender ?? null)

  return (
    <main className="min-h-screen pt-24 pb-16 px-8">
      <div className="max-w-[896px] mx-auto flex flex-col gap-8">
        <HeroSection
          userName={displayName}
          birthday={displayBirthday}
          isEditing={isEditing}
          isLoading={loading}
          onNameChange={setDraftName}
          onBirthdayChange={setDraftBirthday}
          onEditClick={startEditing}
          onSave={saveProfile}
          onCancel={cancelEditing}
          saving={saving}
        />

        {error && (
          <div className="bg-[#fef2f2] border border-[#fecaca] rounded-2xl px-5 py-4">
            <p className="text-[#dc2626] font-medium text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-4 gap-6">
          <AboutMeCard
            bio={displayBio}
            gender={displayGender}
            rating={profile?.rating ?? null}
            isEditing={isEditing}
            isLoading={loading}
            onBioChange={setDraftBio}
            onGenderChange={setDraftGender}
            onEditClick={startEditing}
          />
          <InterestsCard
            sports={displaySports}
            isEditing={isEditing}
            isLoading={loading}
            onSportsChange={setDraftSports}
            onEditClick={startEditing}
          />
          <MediaGallery
            userId={userId}
            photos={photos}
            loading={photosLoading}
            addPhoto={addPhoto}
            removePhoto={removePhoto}
          />
          <AccountSettings
            lookingFor={profile?.looking_for ?? null}
            minAgePref={profile?.min_age_pref ?? 18}
            maxAgePref={profile?.max_age_pref ?? 99}
            minFtpPref={profile?.min_ftp_pref ?? 50}
            maxFtpPref={profile?.max_ftp_pref ?? 500}
            requireFtp={profile?.require_ftp ?? false}
            isLoading={loading}
            onLookingForChange={saveLookingFor}
            onAgePrefsChange={saveAgePrefs}
            onFtpPrefsChange={saveFtpPrefs}
          />
        </div>

        {/* Strava panel — shown whenever the user has linked Strava (i.e. we
            have a sync timestamp). For unconnected users we render nothing
            and let the AccountSettings → Integrations row prompt them to
            connect. */}
        {profile?.strava_synced_at && (
          <StravaActivityPanel
            ftp={profile.strava_ftp ?? null}
            stats={profile.strava_stats ?? []}
          />
        )}
      </div>
    </main>
  )
}
