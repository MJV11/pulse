
import { MdLocationPin } from 'react-icons/md'
import { supabase } from '../../lib/supabase'
import { calculateAge } from '../../lib/age'
import { gradientFor } from '../../lib'
import type { ProfileDetailUser } from '../../lib/types'
import { StravaActivityPanel } from '../profile/StravaActivityPanel'

interface ProfileDetailCardProps {
  user: ProfileDetailUser
  /**
   * Distance label rendered over the photo (e.g. "3.2 miles away"). When
   * omitted (matches / messages contexts), the distance row is hidden.
   */
  distanceLabel?: string
  /**
   * Pre-resolved photo URLs for the photo carousel at the top. When this is
   * an empty array the card falls back to the user's `first_photo_path`.
   * Discovery passes the full gallery here so the user can flip through
   * photos at the top of the card.
   */
  photos?: string[]
  /** Index into `photos` to display in the hero. Defaults to 0. */
  photoIndex?: number
  /**
   * When true the card has no max-height and no inner scroll — it just
   * grows with content. Used inside the modal where the modal panel
   * controls scrolling. Discovery uses the default (false) so the card
   * stays bounded and scrolls internally.
   */
  unbounded?: boolean
  /**
   * When false, only the photo hero renders and the bio / sports / Strava
   * / photos sections are hidden. Discovery starts collapsed and lets the
   * user expand on click or ↑. The modal always passes `true`.
   * Defaults to true so existing call sites stay unchanged.
   */
  expanded?: boolean
  /**
   * Click handler for the photo hero. Discovery uses this to toggle the
   * `expanded` state. When omitted the hero is non-interactive.
   */
  onHeroClick?: () => void
  /**
   * The form the card is being rendered in. Used to determine the card's layout.
   */
  form?: 'discovery' | 'modal'
}

const CHIP_STYLES = [
  { bg: 'bg-[rgba(254,226,226,0.5)]', text: 'text-[#dc2626]' },
  { bg: 'bg-[rgba(252,231,243,0.5)]', text: 'text-[#db2777]' },
  { bg: 'bg-[#fef2f2]', text: 'text-[#b91c1c]' },
  { bg: 'bg-[#fdf2f8]', text: 'text-[#be185d]' },
]

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function StravaLogoWhite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="white" className={className} aria-hidden="true">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0l-7 13.828h4.172" />
    </svg>
  )
}

function getPublicUrl(storagePath: string): string {
  return supabase.storage.from('gallery').getPublicUrl(storagePath).data.publicUrl
}

/**
 * The shared profile detail layout: a photo hero on top followed by an
 * about / sports / Strava / photos section beneath. Used inline on the
 * Discovery page (scrollable) and inside the user profile modal.
 *
 * Photos for the gallery section are fetched on mount unless the card has
 * already been rendered for this user — keeps things simple at the cost of
 * one extra API call per card open.
 */
export function ProfileDetailCard({
  user,
  distanceLabel,
  photos,
  photoIndex = 0,
  unbounded = false,
  expanded = true,
  onHeroClick,
  form = 'discovery',
}: ProfileDetailCardProps) {
  const displayName = user.user_name ?? 'Unknown'
  const age = calculateAge(user.birthday)
  const nameWithAge = age != null ? `${displayName}, ${age}` : displayName

  // Resolve the hero photo: prefer the pre-fetched `photos` array (used in
  // discovery so the user can flip through), fall back to the first photo
  // path on the user object.
  const heroPhotos = photos?.length
    ? photos
    : user.first_photo_path
      ? [getPublicUrl(user.first_photo_path)]
      : []
  const heroPhoto = heroPhotos[photoIndex] ?? heroPhotos[0] ?? null
  const multiPhoto = heroPhotos.length > 1

  const ftp = Math.max(user.strava_ftp ?? 0, user.ftp ?? 0)

  return (
    <div
      className={`${form === 'modal' ? 'rounded-t-3xl' : 'rounded-[32px]'} overflow-hidden bg-[#fbf8ff] shadow-[0px_20px_50px_0px_rgba(217,4,41,0.1)] w-full ${
        unbounded ? 'flex flex-col' : 'relative aspect-[3/4]'
      }`}
    >
      {/* In discovery the inner div is absolutely positioned so it fills the
          fixed-size aspect-ratio container and scrolls internally instead of
          pushing the outer container taller when expanded. */}
      <div className={unbounded ? 'flex flex-col' : 'absolute inset-0 overflow-y-auto flex flex-col'}>
      {/* ── Hero photo (3:4 aspect minus 10px) ────────────────────────────── */}
      <div
        className={`relative w-full shrink-0 ${onHeroClick ? 'cursor-pointer' : ''}`}
        style={{
          paddingBottom: expanded ? 'calc(133.333% - 10px)' : '133.333%',
          ...(!heroPhoto ? { background: gradientFor(user.user_id) } : {}),
        }}
        onClick={onHeroClick}
        role={onHeroClick ? 'button' : undefined}
        tabIndex={onHeroClick ? 0 : undefined}
        onKeyDown={onHeroClick ? (e) => { if (e.key === 'Enter') onHeroClick() } : undefined}
      >
        {heroPhoto ? (
          <img
            src={heroPhoto}
            alt={displayName}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/25 font-extrabold text-[160px] leading-none select-none">
              {initials(displayName)}
            </span>
          </div>
        )}

        {/* Gradient overlay so the name text reads well on any photo */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

        {/* Photo progress dots */}
        {multiPhoto && (
          <div className="absolute top-4 left-4 right-4 flex gap-1.5">
            {heroPhotos.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-200 ${i === photoIndex ? 'bg-white' : 'bg-white/35'
                  }`}
              />
            ))}
          </div>
        )}

        {/* Info overlay — name + distance + chips */}
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-10 pt-8 flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-1 min-w-0">
              <h2 className="text-white font-extrabold text-[32px] tracking-tight leading-none">
                {nameWithAge}
              </h2>
              {user.bio && (
                <p className="text-white text-sm font-medium line-clamp-2">{user.bio}</p>
              )}
              {distanceLabel && (
                <div className="flex items-center gap-2 opacity-90 text-white">
                  <MdLocationPin size={14} />
                  <span className="font-semibold text-[14px]">{distanceLabel}</span>
                </div>
              )}
            </div>

            {/* Strava FTP badge — always visible, even when card is collapsed */}
            {ftp > 0 && (
              <div className="shrink-0 flex flex-col items-center gap-1 backdrop-blur-md bg-[#fc4c02]/80 rounded-2xl px-3 py-2">
                <StravaLogoWhite className="w-4 h-4" />
                <span className="text-white font-bold text-sm tabular-nums leading-none">
                  {ftp}W
                </span>
                <span className="text-white/70 font-medium text-[9px] uppercase tracking-wide leading-none">
                  FTP
                </span>
              </div>
            )}
          </div>

          {user.sports.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {user.sports.map((interest) => (
                <span
                  key={interest}
                  className="backdrop-blur-md bg-white/10 border border-white/10 rounded-full px-[13px] py-1 text-white font-medium text-xs"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Scrollable info section — only rendered when expanded so the
          collapsed card stays a pure photo hero. */}
      {expanded && (
        <div className="flex flex-col gap-5 p-6">
          {user.bio && (
            <div className="bg-white rounded-2xl p-5 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)]">
              <h3 className="text-[#1d1a20] font-bold text-base mb-3">About</h3>
              <p className="text-[#534342] font-medium text-[15px] leading-relaxed">{user.bio}</p>
            </div>
          )}

          {user.sports.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)]">
              <h3 className="text-[#1d1a20] font-bold text-base mb-3">Sports</h3>
              <div className="flex flex-wrap gap-2">
                {user.sports.map((sport, i) => {
                  const style = CHIP_STYLES[i % CHIP_STYLES.length]
                  return (
                    <span
                      key={sport}
                      className={`${style.bg} ${style.text} font-semibold text-sm px-4 py-1.5 rounded-full`}
                    >
                      {sport}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          <StravaActivityPanel
            ftp={ftp}
            stats={user.strava_stats ?? []}
            milePaceSeconds={user.mile_pace_seconds ?? null}
            swimPaceSeconds={user.swim_pace_seconds ?? null}
            hideWhenEmpty
            thirdPerson
          />
        </div>
      )}
      </div>{/* end inner scroll wrapper */}
    </div>
  )
}
