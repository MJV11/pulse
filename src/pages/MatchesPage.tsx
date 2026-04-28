import { MatchCard } from '../components/matches/MatchCard'
import { useMatches } from '../hooks/useMatches'

/**
 * Matches page — responsive grid of match profile cards, each styled like
 * the discovery card but backed by real data from the matches + user_details tables.
 */
export function MatchesPage() {
  const { matches, loading, error } = useMatches()

  return (
    <main className="min-h-screen flex flex-col p-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-[#131b2e] font-extrabold text-3xl tracking-tight">Your Matches</h1>
        {!loading && !error && matches.length > 0 && (
          <p className="text-[#64748b] font-medium text-sm mt-1">
            {matches.length} {matches.length === 1 ? 'match' : 'matches'}
          </p>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[32px] aspect-[3/4] w-full max-w-[360px] bg-[#f1f5f9] animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[#fef2f2] flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="text-[#dc2626] font-semibold text-base">Failed to load matches</p>
          <p className="text-[#94a3b8] text-sm max-w-xs">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && matches.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center shadow-[0px_10px_30px_0px_rgba(217,4,41,0.2)]"
            style={{ background: 'linear-gradient(135deg, #d90429 0%, #ff4d6d 100%)' }}
          >
            <svg width="36" height="34" viewBox="0 0 30 28" fill="none">
              <path
                d="M15 27L2.5 14C0.5 12 0 9.5 1 7.5C2 5.5 4 4 6.5 4C8.5 4 10.5 5 12 6.5L15 9.5L18 6.5C19.5 5 21.5 4 23.5 4C26 4 28 5.5 29 7.5C30 9.5 29.5 12 27.5 14L15 27Z"
                fill="white"
              />
            </svg>
          </div>
          <div>
            <p className="text-[#131b2e] font-bold text-xl">No matches yet</p>
            <p className="text-[#94a3b8] text-sm mt-1 max-w-xs">
              Keep swiping on Discovery — your matches will appear here.
            </p>
          </div>
        </div>
      )}

      {/* Matches grid */}
      {!loading && !error && matches.length > 0 && (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-8">
          {matches.map((match) => (
            <MatchCard key={match.match_id} match={match} />
          ))}
        </div>
      )}
    </main>
  )
}
