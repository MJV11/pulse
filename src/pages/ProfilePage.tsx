import { useEffect, useState } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { HeroSection } from '../components/profile/HeroSection'
import { AboutMeCard } from '../components/profile/AboutMeCard'
import { InterestsCard } from '../components/profile/InterestsCard'
import { MediaGallery } from '../components/profile/MediaGallery'
import { AccountSettings } from '../components/profile/AccountSettings'
import { SetupProfileFlow } from '../components/profile/SetupProfileFlow'
import { useProfile } from '../hooks/useProfile'
import type { UserProfile } from '../hooks/useProfile'

/**
 * My Profile page — fetches real data from user_details.
 * Automatically prompts the setup wizard when no profile exists yet.
 */
export function ProfilePage() {
  const { profile, loading, refresh } = useProfile()
  const [showEdit, setShowEdit] = useState(false)

  // Auto-trigger setup flow as soon as we know there's no profile
  const needsSetup = !loading && profile === null
  useEffect(() => {
    if (needsSetup) setShowEdit(true)
  }, [needsSetup])

  function handleFlowComplete(saved: UserProfile) {
    refresh()
    setShowEdit(false)
  }

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
                userName={profile?.user_name ?? null}
                rating={profile?.rating ?? null}
                onEditClick={() => setShowEdit(true)}
              />

              <div className="grid grid-cols-3 gap-6">
                <AboutMeCard
                  bio={profile?.bio ?? null}
                  onEditClick={() => setShowEdit(true)}
                />
                <InterestsCard
                  sports={profile?.sports ?? []}
                  onEditClick={() => setShowEdit(true)}
                />
                <MediaGallery />
                <AccountSettings />
              </div>
            </>
          )}
        </div>
      </main>

      {/* Setup / Edit flow */}
      {showEdit && (
        <SetupProfileFlow
          mode={needsSetup ? 'setup' : 'edit'}
          initialValues={
            profile
              ? {
                  user_name: profile.user_name ?? undefined,
                  bio: profile.bio ?? undefined,
                  sports: profile.sports,
                }
              : undefined
          }
          onComplete={handleFlowComplete}
          onDismiss={needsSetup ? undefined : () => setShowEdit(false)}
        />
      )}
    </div>
  )
}
