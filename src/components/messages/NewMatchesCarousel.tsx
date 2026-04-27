import { supabase } from '../../lib/supabase'
import type { MatchItem } from '../../hooks/useMatches'

interface NewMatchesCarouselProps {
  matches: MatchItem[]
  onSelect: (userId: string) => void
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

export function NewMatchesCarousel({ matches, onSelect }: NewMatchesCarouselProps) {
  if (matches.length === 0) return null

  return (
    <div className="px-6 pt-5 pb-4 flex flex-col gap-3 border-b border-[#f1f5f9]">
      <p className="text-[#5c403a] font-semibold text-xs tracking-[1.4px] uppercase">
        New Matches
      </p>
      <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-none">
        {matches.map((match) => {
          const { user } = match
          const photoUrl = user.first_photo_path
            ? supabase.storage.from('gallery').getPublicUrl(user.first_photo_path).data.publicUrl
            : null

          return (
            <button
              key={match.match_id}
              className="flex flex-col items-center gap-[6px] shrink-0 group"
              onClick={() => onSelect(user.user_id)}
            >
              <div className="relative">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={user.user_name ?? 'Match'}
                    className="w-[52px] h-[52px] rounded-full object-cover border-2 border-[#ef4444] group-hover:opacity-90 transition-opacity"
                  />
                ) : (
                  <div
                    className="w-[52px] h-[52px] rounded-full flex items-center justify-center border-2 border-[#ef4444] group-hover:opacity-90 transition-opacity"
                    style={{ background: gradientFor(user.user_id) }}
                  >
                    <span className="text-white font-bold text-base leading-none select-none">
                      {initials(user.user_name)}
                    </span>
                  </div>
                )}
                {/* Pulse ring on hover */}
                <span className="absolute inset-0 rounded-full ring-2 ring-[#ef4444]/0 group-hover:ring-[#ef4444]/30 transition-all" />
              </div>
              <span className="text-[#131b2e] font-medium text-[11px] max-w-[52px] truncate leading-none">
                {user.user_name ?? 'Unknown'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
