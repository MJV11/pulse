import type { DiscoveryProfile } from '../../lib/types'
import { MdLocationPin } from 'react-icons/md'
import { gradientFor } from '../../lib'

interface ProfileCardProps {
  profile: DiscoveryProfile
  /**
   * Full list of resolved photo URLs for this user. When provided (and
   * non-empty) it overrides `profile.photo`; the card shows whichever
   * photo is at `photoIndex`.
   */
  photos?: string[]
  /** Index into `photos` to display. Defaults to 0. */
  photoIndex?: number
  onClick?: () => void
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Swipeable profile card with gradient overlay, name, location, and interest chips.
 *
 * Supports multiple photos: pass `photos` + `photoIndex` to control which
 * photo is displayed. Progress dots are shown at the top when there are
 * multiple photos.
 *
 * When no photo URL is resolved the card shows a gradient background with
 * large initials.
 */
export function ProfileCard({ profile, photos, photoIndex = 0, onClick }: ProfileCardProps) {
  const allPhotos = photos?.length ? photos : profile.photo ? [profile.photo] : []
  const currentPhoto = allPhotos[photoIndex] ?? allPhotos[0] ?? null
  const hasPhoto = !!currentPhoto
  const multiPhoto = allPhotos.length > 1

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={`relative rounded-[32px] overflow-hidden shadow-[0px_20px_50px_0px_rgba(217,4,41,0.1)] w-full aspect-[3/4] ${onClick ? 'cursor-pointer' : ''}`}
      style={!hasPhoto ? { background: gradientFor(profile.id) } : undefined}
    >
      {/* Photo or ghost initials */}
      {hasPhoto ? (
        <img
          src={currentPhoto!}
          alt={profile.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white/25 font-extrabold text-[160px] leading-none select-none">
            {initials(profile.name)}
          </span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

      {/* Photo progress dots — only shown when there are multiple photos */}
      {multiPhoto && (
        <div className="absolute top-4 left-4 right-4 flex gap-1.5">
          {allPhotos.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                i === photoIndex ? 'bg-white' : 'bg-white/35'
              }`}
            />
          ))}
        </div>
      )}

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-8 pb-10 pt-8 flex flex-col gap-4">
        {/* Name + location */}
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            {/* Name row */}
            <div className="flex items-center gap-2">
              <h2 className="text-white font-extrabold text-[32px] tracking-tight leading-none">
                {profile.name}{profile.age ? `, ${profile.age}` : ''}
              </h2>
              {profile.verified && (
                <img
                  src="https://www.figma.com/api/mcp/asset/4ce539d9-ac5b-48ea-9a42-9e99adb737c9"
                  alt="Verified"
                  className="w-[22px] h-[21px] object-contain"
                />
              )}
            </div>
            {profile.bio && (
              <p className="text-white text-sm font-medium line-clamp-2">{profile.bio}</p>
            )}
            {/* Distance */}
            <div className="flex items-center gap-2 opacity-90 text-white">
              <MdLocationPin size={14} />
              <span className="font-semibold text-[14px]">{profile.distance}</span>
            </div>
          </div>
        </div>

        {/* Interest/sport chips */}
        <div className="flex gap-2 flex-wrap">
          {profile.interests.map((interest) => (
            <span
              key={interest}
              className="backdrop-blur-md bg-white/10 border border-white/10 rounded-full px-[13px] py-1 text-white font-medium text-xs"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
