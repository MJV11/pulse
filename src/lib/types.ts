// ── Core types ─────────────────────────────────────────────────────────────

export interface DiscoveryProfile {
  id: string
  name: string
  age?: number
  photo?: string
  bio?: string | null
  distance: string
  verified: boolean
  interests: string[]
}

/**
 * 14-day per-sport-type Strava activity summary. Compiled server-side from
 * the user's Strava activity feed and refreshed at most once per hour. The
 * `sport_type` matches Strava's own classification (e.g. 'Ride', 'Run',
 * 'TrailRun', 'VirtualRide', 'Swim', 'Hike').
 */
export interface StravaSportStat {
  sport_type: string
  activity_count_14d: number
  total_seconds_14d: number
  /** ISO timestamp of the most recent activity of this type within the 14d window. */
  latest_activity_at: string | null
}

/**
 * Loose user shape consumed by `ProfileDetailCard` and the user profile
 * modal. The discovery feed (`NearbyUser`), matches list (`MatchedUser`),
 * and conversation partners (`ConversationPartner`) all satisfy this — we
 * keep it intentionally permissive so any of them can be passed in directly.
 */
export interface ProfileDetailUser {
  user_id: string
  user_name: string | null
  bio: string | null
  birthday: string | null
  sports: string[]
  rating?: number | null
  first_photo_path: string | null
  /** Distance in miles from the viewer. Only set in the discovery feed. */
  distance_miles?: number
  strava_ftp?: number | null
  strava_stats?: StravaSportStat[]
  /** User self-reported FTP in watts, or null if not set. */
  ftp?: number | null
  /** User self-reported mile run pace in seconds, or null if not set. */
  mile_pace_seconds?: number | null
  /** User self-reported 100-yard freestyle pace in seconds, or null if not set. */
  swim_pace_seconds?: number | null
}

export interface Conversation {
  id: string
  name: string
  /**
   * Public photo URL for the partner, or `null` if they have no photo set.
   * Consumers should render a gradient + initials fallback when null.
   */
  avatar: string | null
  lastMessage: string
  time: string
  unread: boolean
  online?: boolean
}

export type MessageType = 'sent' | 'received'

export interface Message {
  id: string
  type: MessageType
  content: string
  /** Pre-formatted local-zone time-of-day for the bubble (e.g. "10:42 AM"). */
  time: string
  /**
   * Raw ISO 8601 timestamp from the server. Used by the chat window to group
   * messages into per-day buckets in the viewer's local timezone. Optional so
   * static demo messages without a real timestamp still render.
   */
  timestamp?: string
  avatar?: string
  image?: string
  reacted_with?: string
}
