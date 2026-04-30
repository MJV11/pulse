import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProfileCard } from '../components/discovery/ProfileCard'
import { ActionControls } from '../components/discovery/ActionControls'
import { UserProfileModal } from '../components/discovery/UserProfileModal'
import { MatchCelebration } from '../components/discovery/MatchCelebration'
import { useDiscovery } from '../hooks/useDiscovery'
import type { NearbyUser } from '../hooks/useDiscovery'
import type { DiscoveryProfile } from '../lib/types'
import { supabase } from '../lib/supabase'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../context/ProfileContext'
import { calculateAge } from '../lib/age'
import { gradientFor } from '../lib'

interface LikeResponse {
  data: {
    matched: boolean
    match_id?: string
    user?: {
      user_id: string
      user_name: string | null
      bio: string | null
      birthday: string | null
      sports: string[]
      rating: number | null
      first_photo_path: string | null
      [key: string]: unknown
    }
  }
}

interface MatchCelebrationState {
  userId: string
  userName: string
  photoUrl: string | null
}

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
    age: calculateAge(user.birthday) ?? undefined,
    photo: photoUrl,
    bio: user.bio,
    distance: distanceLabel,
    verified: false,
    interests: user.sports ?? [],
  }
}

/** How long the swipe-off animation runs. Keep in sync with the CSS transition. */
const SWIPE_MS = 320

type SwipeDirection = 'left' | 'right' | 'up'

/**
 * Discovery (swipe) page — shows real nearby users from the API as swipeable
 * profile cards. Like/Dislike/Rewind navigate through the stack.
 * On a mutual like the `process_like` RPC returns `matched: true` and we
 * show a celebration overlay before advancing.
 *
 * Keyboard shortcuts:
 *   ← / →   Nope / Like
 *   ↑        Open profile
 *   ↓        Close profile
 *   Space    Next photo
 */
export function DiscoveryPage() {
  const { session } = useAuth()
  const { profile: myProfile, isPremium } = useProfile()
  const navigate = useNavigate()
  const { users, loading, noLocation, error } = useDiscovery(50)
  const [index, setIndex] = useState(0)
  const [radiusMiles] = useState(50)
  const [modalUser, setModalUser] = useState<NearbyUser | null>(null)
  const [celebration, setCelebration] = useState<MatchCelebrationState | null>(null)
  const [liking, setLiking] = useState(false)
  /** Direction the active card is flying off in, or `null` when at rest. */
  const [exitDirection, setExitDirection] = useState<SwipeDirection | null>(null)
  /** Flips to true a frame after a new card mounts so we can animate it in. */
  const [entered, setEntered] = useState(false)

  // ── Multi-photo support ──────────────────────────────────────────────────────
  /** All resolved photo URLs for the currently visible card. */
  const [currentPhotos, setCurrentPhotos] = useState<string[]>([])
  /** Which photo in currentPhotos is being displayed. */
  const [photoIdx, setPhotoIdx] = useState(0)

  const currentUser = users[index]
  const profile = currentUser ? toProfile(currentUser) : null

  // Fetch all photos for the current user whenever the card changes
  useEffect(() => {
    setPhotoIdx(0)
    setCurrentPhotos([])
    if (!currentUser || !session?.access_token) return

    let cancelled = false
    apiFetch<{ data: Array<{ storage_path: string }> }>(
      `/users/${currentUser.user_id}/photos`,
      session.access_token,
    )
      .then(({ data }) => {
        if (cancelled) return
        const urls = data.map(
          (p) => supabase.storage.from('gallery').getPublicUrl(p.storage_path).data.publicUrl,
        )
        setCurrentPhotos(urls)
      })
      .catch(() => {
        // Silently fall back to first_photo_path already on the profile
      })

    return () => { cancelled = true }
  }, [currentUser?.user_id, session?.access_token])

  // Run an entrance animation each time a new card lands
  useEffect(() => {
    if (!currentUser) return
    setEntered(false)
    const id = window.setTimeout(() => setEntered(true), 16)
    return () => window.clearTimeout(id)
  }, [currentUser?.user_id])

  /** Advances to the next card and clears any in-flight exit animation. */
  const advance = useCallback(() => {
    setExitDirection(null)
    setIndex((i) => Math.min(i + 1, users.length))
  }, [users.length])

  /** Triggers the swipe-off animation and resolves once it has finished. */
  const swipeAway = useCallback((direction: SwipeDirection) => {
    return new Promise<void>((resolve) => {
      setExitDirection(direction)
      window.setTimeout(resolve, SWIPE_MS)
    })
  }, [])

  /** Shared like handler — `direction` controls the exit animation. */
  const sendLike = useCallback(
    async (direction: 'right' | 'up') => {
      if (!currentUser || !session?.access_token || liking || exitDirection) return
      setLiking(true)
      const animPromise = swipeAway(direction)
      try {
        const resp = await apiFetch<LikeResponse>(
          '/likes',
          session.access_token,
          {
            method: 'POST',
            body: JSON.stringify({ to_user_id: currentUser.user_id }),
          },
        )
        await animPromise
        if (resp.data.matched && resp.data.user) {
          const { user } = resp.data
          const photoUrl = user.first_photo_path
            ? supabase.storage.from('gallery').getPublicUrl(user.first_photo_path).data.publicUrl
            : null
          setCelebration({
            userId: user.user_id,
            userName: user.user_name ?? 'Someone',
            photoUrl,
          })
        } else {
          advance()
        }
      } catch (err) {
        console.error('Failed to record like:', err)
        await animPromise
        advance()
      } finally {
        setLiking(false)
      }
    },
    [currentUser, session?.access_token, liking, exitDirection, advance, swipeAway],
  )

  const handleLike = useCallback(() => sendLike('right'), [sendLike])

  // Super Pulse is premium-gated in the UI. The backend doesn't differentiate
  // it from a regular like yet, so it routes through `sendLike` with an
  // upward exit. When we add a real super-like flow, swap this for a
  // dedicated handler.
  const handleSuperPulse = useCallback(() => sendLike('up'), [sendLike])

  const handleLikeFromModal = useCallback(async () => {
    setModalUser(null)
    await sendLike('right')
  }, [sendLike])

  const handleDislike = useCallback(async () => {
    if (exitDirection) return
    setModalUser(null)
    await swipeAway('left')
    advance()
  }, [exitDirection, advance, swipeAway])

  const handleRewind = useCallback(() => {
    if (exitDirection) return
    setIndex((i) => Math.max(i - 1, 0))
  }, [exitDirection])

  const handleNextPhoto = useCallback(() => {
    if (currentPhotos.length > 1) {
      setPhotoIdx((i) => (i + 1) % currentPhotos.length)
    }
  }, [currentPhotos.length])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't hijack shortcuts when typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) return

      switch (e.key) {
        case 'ArrowLeft':
          handleDislike()
          break
        case 'ArrowRight':
          handleLike()
          break
        case 'ArrowUp':
          if (!modalUser && currentUser) setModalUser(currentUser)
          break
        case 'ArrowDown':
          if (modalUser) setModalUser(null)
          break
        case ' ':
          e.preventDefault()
          handleNextPhoto()
          break
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleDislike, handleLike, handleNextPhoto, modalUser, currentUser])

  function dismissCelebration() {
    setCelebration(null)
    advance()
  }

  /** Public URL for the current user's first gallery photo, used in the
      match celebration so we can show "you & them" side by side. */
  const myPhotoUrl = myProfile?.first_photo_path
    ? supabase.storage.from('gallery').getPublicUrl(myProfile.first_photo_path).data.publicUrl
    : null

  /** Resting / entering / exiting transform for the active card. */
  const cardTransform = (() => {
    switch (exitDirection) {
      case 'right':
        return 'translate3d(140%, -8%, 0) rotate(20deg)'
      case 'left':
        return 'translate3d(-140%, -8%, 0) rotate(-20deg)'
      case 'up':
        return 'translate3d(0, -130%, 0) rotate(-2deg) scale(0.92)'
      default:
        return entered
          ? 'translate3d(0, 0, 0) scale(1)'
          : 'translate3d(0, 12px, 0) scale(0.96)'
    }
  })()
  const cardOpacity = exitDirection ? 0 : entered ? 1 : 0

  return (
    <div className="flex flex-col min-h-screen">
      <main className="min-h-[calc(100vh-53px)] flex flex-col items-center justify-center p-12 relative">
        {/* Card + controls column */}
        <div className="flex flex-col items-center gap-8 w-1/2 max-w-[500px]">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="w-full aspect-[3/4] rounded-[32px] bg-[#f1f5f9] animate-pulse" />
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
              {index + 1 < users.length && (
                <div
                  className="absolute"
                  style={{
                    width: 'calc(100% - 96px)',
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

              <div className="relative z-10 flex flex-col items-center gap-8 w-full">
                <div className="absolute -top-3 -right-6 bg-white rounded-full px-3 py-1 text-xs font-semibold text-[#64748b] shadow-sm">
                  {index + 1} / {users.length}
                </div>
                <div
                  key={currentUser.user_id}
                  className="w-full will-change-transform"
                  style={{
                    transform: cardTransform,
                    opacity: cardOpacity,
                    transition: `transform ${SWIPE_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${SWIPE_MS - 40}ms ease-out`,
                    pointerEvents: exitDirection ? 'none' : undefined,
                  }}
                >
                  <ProfileCard
                    profile={profile}
                    photos={currentPhotos}
                    photoIndex={photoIdx}
                    onClick={() => setModalUser(currentUser)}
                  />
                </div>
                <ActionControls
                  onLike={handleLike}
                  onDislike={handleDislike}
                  onRewind={isPremium && index > 0 ? handleRewind : undefined}
                />
              </div>
            </>
          )}
        </div>
      </main>
      {/* Keyboard shortcut hint bar */}
      <div className="flex mt-auto items-center justify-center gap-6 py-3 px-6">
        <KeyHint keys={['←']} label="Nope" />
        <Divider />
        <KeyHint keys={['→']} label="Like" />
        <Divider />
        <KeyHint keys={['↑']} label="Open Profile" />
        <Divider />
        <KeyHint keys={['↓']} label="Close Profile" />
        <Divider />
        <KeyHint keys={['Space']} label="Next Photo" />
      </div>


      {/* User profile modal */}
      {modalUser && (
        <UserProfileModal
          user={modalUser}
          distanceLabel={toProfile(modalUser).distance}
          onClose={() => setModalUser(null)}
          onLike={handleLikeFromModal}
          onDislike={handleDislike}
        />
      )}

      {/* Match celebration overlay */}
      {celebration && (
        <MatchCelebration
          myPhotoUrl={myPhotoUrl}
          myInitial={myProfile?.user_name?.[0] ?? 'Y'}
          theirName={celebration.userName}
          theirPhotoUrl={celebration.photoUrl}
          onMessage={() =>
            navigate('/messages', {
              state: { partnerId: celebration.userId },
            })
          }
          onKeepSwiping={dismissCelebration}
        />
      )}
    </div>
  )
}

// ── Keyboard shortcut hint bar ─────────────────────────────────────────────────

interface KeyHintProps {
  keys: string[]
  label: string
}

function KeyHint({ keys, label }: KeyHintProps) {
  return (
    <div className="flex items-center gap-1.5">
      {keys.map((k) => (
        <kbd
          key={k}
          className={`inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-md border border-[#cbd5e1] bg-white text-[#475569] ${label == 'Next Photo' ? 'text-xs' : 'text-md'} font-semibold shadow-[0_1px_0_0_#cbd5e1] select-none`}
        >
          {k}
        </kbd>
      ))}
      <span className="text-[#64748b] text-xs font-medium">{label}</span>
    </div>
  )
}

function Divider() {
  return <div className="w-px h-4 bg-[#e2e8f0]" />
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function gradientForIndex(i: number, users: NearbyUser[]) {
  const id = users[i]?.user_id ?? String(i)
  return gradientFor(id)
}
