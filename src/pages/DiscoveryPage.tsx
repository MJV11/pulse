import { useState } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { ProfileCard } from '../components/discovery/ProfileCard'
import { ActionControls } from '../components/discovery/ActionControls'
import { UserProfileModal } from '../components/discovery/UserProfileModal'
import { useDiscovery } from '../hooks/useDiscovery'
import type { NearbyUser } from '../hooks/useDiscovery'
import type { DiscoveryProfile } from '../lib/data'
import { DISCOVERY_BTN_FILTER } from '../lib/assets'
import { supabase } from '../lib/supabase'

function toProfile(user: NearbyUser): DiscoveryProfile {
  const miles = user.distance_miles
  const distanceLabel =
    miles < 1
      ? 'Less than a mile away'
      : `${miles.toFixed(1)} ${miles === 1 ? 'mile' : 'miles'} away`

  const photoUrl = user.first_photo_path
    ? supabase.storage.from('gallery').getPublicUrl(user.first_photo_path).data.publicUrl
    : undefined

  return {
    id: user.user_id,
    name: user.user_name ?? 'Unknown',
    photo: photoUrl,
    distance: distanceLabel,
    verified: false,
    interests: user.sports ?? [],
  }
}

/**
 * Discovery (swipe) page — shows real nearby users from the API as swipeable
 * profile cards. Like/Dislike/Rewind navigate through the stack.
 */
export function DiscoveryPage() {
  const { users, loading, noLocation, error } = useDiscovery(50)
  const [index, setIndex] = useState(0)
  const [radiusMiles] = useState(50)
  const [modalUser, setModalUser] = useState<NearbyUser | null>(null)

  const currentUser = users[index]
  const profile = currentUser ? toProfile(currentUser) : null

  function handleLike() {
    setIndex((i) => Math.min(i + 1, users.length))
  }

  function handleDislike() {
    setIndex((i) => Math.min(i + 1, users.length))
  }

  function handleRewind() {
    setIndex((i) => Math.max(i - 1, 0))
  }

  return (
    <div className="flex min-h-screen bg-[#fbf8ff]">
      <Sidebar variant="discovery" />

      <main className="ml-[288px] flex-1 flex items-center justify-center p-12 relative">
        {/* Card + controls column */}
        <div className="flex flex-col items-center gap-8">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-full max-w-[500px] aspect-[3/4] rounded-[32px] bg-[#f1f5f9] animate-pulse" />
              <p className="text-[#94a3b8] text-sm">Finding people near you…</p>
            </div>
          )}

          {/* No location shared yet */}
          {!loading && noLocation && (
            <div className="flex flex-col items-center gap-5 text-center max-w-sm">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center shadow-[0px_10px_30px_0px_rgba(217,4,41,0.2)]"
                style={{ background: 'linear-gradient(135deg, #d90429 0%, #ff4d6d 100%)' }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                    fill="white"
                  />
                </svg>
              </div>
              <div>
                <p className="text-[#131b2e] font-bold text-xl">Location needed</p>
                <p className="text-[#94a3b8] text-sm mt-1">
                  Allow location access in your browser and reload to see people within {radiusMiles} miles.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-[#dc2626] font-semibold">Failed to load profiles</p>
              <p className="text-[#94a3b8] text-sm">{error}</p>
            </div>
          )}

          {/* Stack exhausted */}
          {!loading && !noLocation && !error && users.length > 0 && index >= users.length && (
            <div className="flex flex-col items-center gap-5 text-center max-w-sm">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center shadow-[0px_10px_30px_0px_rgba(217,4,41,0.2)]"
                style={{ background: 'linear-gradient(135deg, #d90429 0%, #ff4d6d 100%)' }}
              >
                <svg width="36" height="34" viewBox="0 0 30 28" fill="none">
                  <path d="M15 27L2.5 14C0.5 12 0 9.5 1 7.5C2 5.5 4 4 6.5 4C8.5 4 10.5 5 12 6.5L15 9.5L18 6.5C19.5 5 21.5 4 23.5 4C26 4 28 5.5 29 7.5C30 9.5 29.5 12 27.5 14L15 27Z" fill="white" />
                </svg>
              </div>
              <div>
                <p className="text-[#131b2e] font-bold text-xl">You've seen everyone nearby</p>
                <p className="text-[#94a3b8] text-sm mt-1">
                  Check back later or try expanding your radius.
                </p>
              </div>
              <button
                onClick={() => setIndex(0)}
                className="px-6 py-3 rounded-2xl text-white font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg, #d90429 0%, #ff4d6d 100%)' }}
              >
                Start over
              </button>
            </div>
          )}

          {/* Empty area (no users in range) */}
          {!loading && !noLocation && !error && users.length === 0 && (
            <div className="flex flex-col items-center gap-4 text-center max-w-sm">
              <p className="text-[#131b2e] font-bold text-xl">Nobody nearby yet</p>
              <p className="text-[#94a3b8] text-sm">
                No other users within {radiusMiles} miles. Invite friends or check back later.
              </p>
            </div>
          )}

          {/* Active card */}
          {!loading && profile && index < users.length && (
            <>
              {/* Stack depth hint: ghost card behind */}
              {index + 1 < users.length && (
                <div
                  className="absolute"
                  style={{
                    width: 'calc(min(500px, 100% - 96px))',
                    aspectRatio: '3/4',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, calc(-50% + 12px)) scale(0.95)',
                    borderRadius: 32,
                    background: gradientForIndex(index + 1, users),
                    zIndex: 0,
                  }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-[500px]">
                {/* Counter badge */}
                <div className="absolute -top-3 right-0 bg-white rounded-full px-3 py-1 text-xs font-semibold text-[#64748b] shadow-sm">
                  {index + 1} / {users.length}
                </div>
                <ProfileCard
                  profile={profile}
                  onClick={() => setModalUser(currentUser)}
                />
                <ActionControls
                  onLike={handleLike}
                  onDislike={handleDislike}
                  onRewind={index > 0 ? handleRewind : undefined}
                />
              </div>
            </>
          )}
        </div>

        {/* Floating filter FAB */}
        <button
          className="absolute bottom-12 right-12 w-14 h-14 rounded-full flex items-center justify-center shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] hover:opacity-90 active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg, #d90429 0%, #ff4d6d 100%)' }}
          aria-label="Filter"
        >
          <img src={DISCOVERY_BTN_FILTER} alt="" className="w-[18px] h-[18px] object-contain" />
        </button>
      </main>

      {/* User profile modal */}
      {modalUser && (
        <UserProfileModal
          user={modalUser}
          distanceLabel={toProfile(modalUser).distance}
          onClose={() => setModalUser(null)}
          onLike={handleLike}
          onDislike={handleDislike}
        />
      )}
    </div>
  )
}

const GRADIENTS = [
  'linear-gradient(135deg, #d90429 0%, #ff4d6d 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
  'linear-gradient(135deg, #0369a1 0%, #38bdf8 100%)',
  'linear-gradient(135deg, #b45309 0%, #fbbf24 100%)',
  'linear-gradient(135deg, #065f46 0%, #34d399 100%)',
]

function gradientForIndex(i: number, users: NearbyUser[]) {
  const id = users[i]?.user_id ?? String(i)
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return GRADIENTS[hash % GRADIENTS.length]
}
