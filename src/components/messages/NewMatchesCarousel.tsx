import { supabase } from '../../lib/supabase'
import type { MatchItem } from '../../hooks/useMatches'

interface NewMatchesCarouselProps {
  matches: MatchItem[]
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

/**
 * Horizontal scroll row of new match avatars.
 * Only rendered when there are recent matches to show.
 */
export function NewMatchesCarousel({ matches }: NewMatchesCarouselProps) {
  if (matches.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[#5c403a] font-medium text-xs tracking-[1.2px] uppercase">New Matches</p>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
        {matches.map((match) => {
          const { user } = match
          const photoUrl = user.first_photo_path
            ? supabase.storage.from('gallery').getPublicUrl(user.first_photo_path).data.publicUrl
            : null

          return (
            <button key={match.match_id} className="flex flex-col items-center gap-[7px] shrink-0">
              <div className="relative">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={user.user_name ?? 'Match'}
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#ef4444]"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-[#ef4444]"
                    style={{ background: gradientFor(user.user_id) }}
                  >
                    <span className="text-white font-bold text-lg leading-none select-none">
                      {initials(user.user_name)}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-[#131b2e] font-medium text-xs max-w-[56px] truncate">
                {user.user_name ?? 'Unknown'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
