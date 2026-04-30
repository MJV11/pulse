import { supabase } from '../../lib/supabase'
import type { MatchItem } from '../../hooks/useMatches'
import { calculateAge } from '../../lib/age'
import { gradientFor } from '../../lib'

interface MatchCardProps {
  match: MatchItem
  /**
   * Click handler — typically opens the profile detail modal in the parent.
   * If omitted the card is non-interactive.
   */
  onClick?: () => void
}



function initials(name: string | null) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function MatchCard({ match, onClick }: MatchCardProps) {
  const { user } = match
  const displayName = user.user_name ?? 'Unknown'
  const age = calculateAge(user.birthday)
  const nameWithAge = age != null ? `${displayName}, ${age}` : displayName

  const photoUrl = user.first_photo_path
    ? supabase.storage.from('gallery').getPublicUrl(user.first_photo_path).data.publicUrl
    : null

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative rounded-[32px] overflow-hidden shadow-[0px_20px_50px_0px_rgba(217,4,41,0.1)] w-full max-w-[360px] aspect-[3/4] text-left transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0px_24px_60px_0px_rgba(217,4,41,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d90429] focus-visible:ring-offset-2"
      style={photoUrl ? undefined : { background: gradientFor(user.user_id) }}
    >
      {/* Background: photo or gradient initials */}
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={displayName}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white/30 font-extrabold text-[120px] leading-none select-none">
            {initials(user.user_name)}
          </span>
        </div>
      )}

      {/* Rating badge */}
      {user.rating != null && (
        <div className="absolute top-5 right-5 flex items-center gap-1 bg-black/30 backdrop-blur-md border border-white/20 rounded-full px-3 py-1">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 1l1.236 2.504L10 3.91 8 5.86l.472 2.751L6 7.25l-2.472 1.361L4 5.86 2 3.91l2.764-.406L6 1z"
              fill="#fbbf24"
            />
          </svg>
          <span className="text-white font-semibold text-xs">{user.rating.toFixed(1)}</span>
        </div>
      )}

      {/* Bottom gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-7 pb-8 pt-6 flex flex-col gap-3">
        <h2 className="text-white font-extrabold text-[28px] tracking-tight leading-none">
          {nameWithAge}
        </h2>

        {user.bio && (
          <p className="text-white/75 text-[13px] font-medium line-clamp-2 leading-snug">
            {user.bio}
          </p>
        )}

        {user.sports.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {user.sports.map((sport) => (
              <span
                key={sport}
                className="backdrop-blur-md bg-white/10 border border-white/10 rounded-full px-[13px] py-1 text-white font-medium text-xs"
              >
                {sport}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}
