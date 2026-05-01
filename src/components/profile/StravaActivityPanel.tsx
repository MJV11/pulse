import type { StravaSportStat } from '../../lib/types'

const STRAVA_ORANGE = '#fc4c02'

interface StravaActivityPanelProps {
  /** Effective FTP in watts — highest of Strava and self-reported. Null when not set. */
  ftp: number | null
  /** Per-sport-type 14-day stats. Empty when no recent activity. */
  stats: StravaSportStat[]
  /** Self-reported mile run pace in seconds (e.g. 360 = 6:00/mi). Null when not set. */
  milePaceSeconds?: number | null
  /** Self-reported 100-yard freestyle pace in seconds (e.g. 90 = 1:30/100yd). Null when not set. */
  swimPaceSeconds?: number | null
  /**
   * When true, hides the panel entirely if there are no stats and no performance metrics.
   * Useful in discovery so we don't render an empty card. Defaults to false.
   */
  hideWhenEmpty?: boolean
  /**
   * When true, swaps the title to "Strava activity" framing for viewing
   * another user. Defaults to false (own profile).
   */
  thirdPerson?: boolean
}

function StravaLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="white" className={className} aria-hidden="true">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0l-7 13.828h4.172" />
    </svg>
  )
}

function formatPace(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatHours(seconds: number): string {
  const hours = seconds / 3600
  if (hours < 0.05) return '<0.1h'
  if (hours < 10) return `${hours.toFixed(1)}h`
  return `${Math.round(hours)}h`
}

/**
 * Maps Strava's `sport_type` values to nicer human labels. Anything we
 * haven't mapped falls through with a basic camelCase → words split so
 * newly-added Strava sport types still render reasonably without a code
 * change.
 */
const SPORT_LABELS: Record<string, string> = {
  Ride: 'Ride',
  VirtualRide: 'Virtual ride',
  EBikeRide: 'E-bike ride',
  MountainBikeRide: 'Mountain bike',
  GravelRide: 'Gravel ride',
  Run: 'Run',
  TrailRun: 'Trail run',
  VirtualRun: 'Virtual run',
  Walk: 'Walk',
  Hike: 'Hike',
  Swim: 'Swim',
  Yoga: 'Yoga',
  WeightTraining: 'Weight training',
  Workout: 'Workout',
  Crossfit: 'CrossFit',
  Rowing: 'Rowing',
  AlpineSki: 'Alpine ski',
  BackcountrySki: 'Backcountry ski',
  NordicSki: 'Nordic ski',
  Snowboard: 'Snowboard',
}

function prettySportLabel(sport: string): string {
  if (SPORT_LABELS[sport]) return SPORT_LABELS[sport]
  return sport.replace(/([A-Z])/g, ' $1').replace(/^\s+/, '').trim()
}

/**
 * Card that summarises a user's last 14 days of Strava activity grouped by
 * sport type, plus their self-reported FTP. Used both on the user's own
 * profile and on the discovery user-profile modal.
 */
export function StravaActivityPanel({
  ftp,
  stats,
  milePaceSeconds,
  swimPaceSeconds,
  hideWhenEmpty = false,
  thirdPerson = false,
}: StravaActivityPanelProps) {
  const hasStats = stats.length > 0
  const hasFtp = typeof ftp === 'number' && ftp > 0
  const hasMilePace = typeof milePaceSeconds === 'number' && milePaceSeconds > 0
  const hasSwimPace = typeof swimPaceSeconds === 'number' && swimPaceSeconds > 0
  const hasAnyMetric = hasFtp || hasMilePace || hasSwimPace

  if (hideWhenEmpty && !hasStats && !hasAnyMetric) return null

  const title = thirdPerson ? 'Strava activity' : 'Your Strava activity'

  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: STRAVA_ORANGE }}
          >
            <StravaLogo className="w-4 h-4" />
          </div>
          <h3 className="text-[#1d1a20] font-bold text-base">{title}</h3>
        </div>
        {hasAnyMetric && (
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {hasFtp && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fef2f2] border border-[#fee2e2]">
                <span className="text-[#94a3b8] font-medium text-[11px] uppercase tracking-wide">FTP</span>
                <span className="text-[#dc2626] font-bold text-sm tabular-nums">{ftp}W</span>
              </div>
            )}
            {hasMilePace && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fef2f2] border border-[#fee2e2]">
                <span className="text-[#94a3b8] font-medium text-[11px] uppercase tracking-wide">Mile</span>
                <span className="text-[#dc2626] font-bold text-sm tabular-nums">{formatPace(milePaceSeconds!)}</span>
              </div>
            )}
            {hasSwimPace && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fef2f2] border border-[#fee2e2]">
                <span className="text-[#94a3b8] font-medium text-[11px] uppercase tracking-wide">100yd</span>
                <span className="text-[#dc2626] font-bold text-sm tabular-nums">{formatPace(swimPaceSeconds!)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {!hasStats ? (
        <p className="text-[#94a3b8] text-sm italic">
          {thirdPerson
            ? 'No tracked activity in the last 14 days.'
            : 'No activity tracked in the last 14 days. Get out there!'}
        </p>
      ) : (
        <>
          <p className="text-[#94a3b8] font-medium text-[11px] uppercase tracking-[1.2px] mb-3">
            Last 14 days
          </p>
          <ul className="flex flex-col gap-2">
            {stats.map((s) => (
              <li
                key={s.sport_type}
                className="flex items-center justify-between rounded-xl bg-[#fef2f2]/40 px-4 py-3"
              >
                <span className="text-[#1d1a20] font-semibold text-sm">
                  {prettySportLabel(s.sport_type)}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[#534342] font-medium text-sm tabular-nums">
                    {s.activity_count_14d}{' '}
                    <span className="text-[#534342] font-medium">
                      {s.activity_count_14d === 1 ? 'activity' : 'activities'}
                    </span>
                  </span>
                  <span className="text-[#dc2626] font-semibold text-sm tabular-nums min-w-[2.5rem] text-right">
                    {formatHours(s.total_seconds_14d)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
