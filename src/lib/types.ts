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
