import type { MatchItem } from '../../hooks/useMatches'

interface MatchCardProps {
  match: MatchItem
}

// Rotate through brand-adjacent gradients based on user_id hash
const GRADIENTS = [
  'linear-gradient(135deg, #d90429 0%, #ff4d6d 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
  'linear-gradient(135deg, #0369a1 0%, #38bdf8 100%)',
  'linear-gradient(135deg, #b45309 0%, #fbbf24 100%)',
  'linear-gradient(135deg, #065f46 0%, #34d399 100%)',
]

function gradientFor(userId: string) {
  const hash = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return GRADIENTS[hash % GRADIENTS.length]
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

/**
 * Match profile card — mirrors the discovery ProfileCard layout with a
 * gradient-initials background in place of a photo.
 */
export function MatchCard({ match }: MatchCardProps) {
  const { user } = match
  const displayName = user.user_name ?? 'Unknown'

  return (
    <div
      className="relative rounded-[32px] overflow-hidden shadow-[0px_20px_50px_0px_rgba(217,4,41,0.1)] w-full max-w-[360px] aspect-[3/4]"
      style={{ background: gradientFor(user.user_id) }}
    >
      {/* Large initials centred on the card */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white/30 font-extrabold text-[120px] leading-none select-none">
          {initials(user.user_name)}
        </span>
      </div>

      {/* Rating badge — top right */}
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-7 pb-8 pt-6 flex flex-col gap-3">
        {/* Name */}
        <h2 className="text-white font-extrabold text-[28px] tracking-tight leading-none">
          {displayName}
        </h2>

        {/* Bio snippet */}
        {user.bio && (
          <p className="text-white/75 text-[13px] font-medium line-clamp-2 leading-snug">
            {user.bio}
          </p>
        )}

        {/* Sports chips */}
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
    </div>
  )
}
