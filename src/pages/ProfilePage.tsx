import { useState } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { HeroSection } from '../components/profile/HeroSection'
import { AboutMeCard } from '../components/profile/AboutMeCard'
import { InterestsCard } from '../components/profile/InterestsCard'
import { MediaGallery, getGalleryPublicUrl } from '../components/profile/MediaGallery'
import { AccountSettings } from '../components/profile/AccountSettings'
import { useProfile } from '../context/ProfileContext'
import { useAuth } from '../context/AuthContext'
import { useProfilePhotos } from '../hooks/useProfilePhotos'
import { apiFetch } from '../lib/api'
import type { UserProfile } from '../hooks/useProfile'

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

  const firstPhotoUrl = photos.length > 0 ? getGalleryPublicUrl(photos[0].storage_path) : null
  const userId = session?.user.id ?? ''

  function startEditing() {
    setDraftName(profile?.user_name ?? '')
    setDraftBio(profile?.bio ?? '')
    setDraftBirthday(profile?.birthday ?? '')
    setDraftSports(profile?.sports ?? [])
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

  const displayName = isEditing ? draftName : (profile?.user_name ?? null)
  const displayBio = isEditing ? draftBio : (profile?.bio ?? null)
  const displayBirthday = isEditing ? draftBirthday : (profile?.birthday ?? null)
  const displaySports = isEditing ? draftSports : (profile?.sports ?? [])

  return (
    <div className="flex min-h-screen bg-[#fbf8ff]">
      <Sidebar variant="profile" />

      <main className="ml-[288px] flex-1 overflow-y-auto pt-24 pb-16 px-8">
        <div className="max-w-[896px] mx-auto flex flex-col gap-8">

          {/* Loading skeleton */}
          {loading && (
            <>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                <div className="h-80 bg-[#f1f5f9]" />
                <div className="px-[33px] pb-[33px] -mt-24 flex items-end gap-6">
                  <div className="w-[160px] h-[160px] rounded-3xl bg-[#e2e8f0] shrink-0" />
                  <div className="pb-2 flex flex-col gap-3 flex-1">
                    <div className="h-8 w-48 bg-[#e2e8f0] rounded-lg" />
                    <div className="h-4 w-32 bg-[#f1f5f9] rounded-lg" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 h-56 bg-white rounded-2xl shadow-sm animate-pulse" />
                <div className="h-56 bg-white rounded-2xl shadow-sm animate-pulse" />
              </div>
            </>
          )}

          {/* Loaded profile */}
          {!loading && profile !== undefined && (
            <>
              <HeroSection
                userName={displayName}
                rating={profile?.rating ?? null}
                birthday={displayBirthday}
                isEditing={isEditing}
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

              <div className="grid grid-cols-3 gap-6">
                <AboutMeCard
                  bio={displayBio}
                  isEditing={isEditing}
                  onBioChange={setDraftBio}
                  onEditClick={startEditing}
                />
                <InterestsCard
                  sports={displaySports}
                  isEditing={isEditing}
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
                <AccountSettings />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
