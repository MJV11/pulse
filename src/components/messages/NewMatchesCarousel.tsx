import { supabase } from '../../lib/supabase'
import type { MatchItem } from '../../hooks/useMatches'
import { UserAvatar } from '../common/UserAvatar'

interface NewMatchesCarouselProps {
  matches: MatchItem[]
  onSelect: (userId: string) => void
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
                <UserAvatar
                  photoUrl={photoUrl}
                  name={user.user_name}
                  userId={user.user_id}
                  size={52}
                  rounded="full"
                  className="border-2 border-[#ef4444] group-hover:opacity-90 transition-opacity"
                />
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
