import type { Match } from '../../lib/data'

interface NewMatchesCarouselProps {
  matches: Map<string, Match>
}

/**
 * Horizontal scroll row of new match avatars with online indicators.
 */
export function NewMatchesCarousel({ matches }: NewMatchesCarouselProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[#5c403a] font-medium text-xs tracking-[1.2px] uppercase">New Matches</p>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
        {Array.from(matches.values()).map((match) => (
          <button key={match.id} className="flex flex-col items-center gap-[7px] shrink-0">
            <div className="relative">
              <img
                src={match.avatar}
                alt={match.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-[#ef4444]"
              />
              {match.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#22c55e] border-2 border-white rounded-full" />
              )}
            </div>
            <span className="text-[#131b2e] font-medium text-xs">{match.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
