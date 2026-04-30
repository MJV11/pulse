import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import { supabase } from '../lib/supabase'
import { formatRelativeShort } from '../lib/time'
import type { Conversation, StravaSportStat } from '../lib/types'

interface ConversationEntry {
  partner_id: string
  partner_name: string | null
  /** Storage path of the partner's first gallery photo, or null. */
  partner_first_photo_path: string | null
  last_message: string
  last_message_at: string
  is_sent_by_me: boolean
  /** Strava FTP (watts) — null when not connected or not set in Strava. */
  strava_ftp?: number | null
  /** 14-day per-sport-type Strava activity summary. Empty when no data. */
  strava_stats?: StravaSportStat[]
  // Forward-compat: backend may include any other user_details columns here.
  [key: string]: unknown
}

interface ConversationsResponse {
  data: ConversationEntry[]
}

/**
 * Rich per-partner profile, keyed by partner_id. Used by the profile detail
 * modal opened from the messages page so we can render bio/sports/Strava
 * the same way discovery does — without needing an extra round-trip.
 */
export interface ConversationPartner {
  user_id: string
  user_name: string | null
  bio: string | null
  birthday: string | null
  sports: string[]
  rating: number | null
  first_photo_path: string | null
  strava_ftp: number | null
  strava_stats: StravaSportStat[]
}

/**
 * Fetches the authenticated user's conversation list from the API and
 * returns both:
 *   • `conversations` — the lean Map<id, Conversation> the list UI expects
 *   • `partners`      — a Map<id, ConversationPartner> the profile modal uses
 *                       so we don't need a second API round-trip on click.
 * Keys are partner UUIDs in both maps.
 */
export function useConversations() {
  const { session } = useAuth()
  const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map())
  const [partners, setPartners] = useState<Map<string, ConversationPartner>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(() => {
    if (!session?.access_token) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    apiFetch<ConversationsResponse>('/messages/conversations', session.access_token)
      .then(({ data }) => {
        const convMap = new Map<string, Conversation>()
        const partnerMap = new Map<string, ConversationPartner>()

        for (const entry of data ?? []) {
          const photoUrl = entry.partner_first_photo_path
            ? supabase.storage
                .from('gallery')
                .getPublicUrl(entry.partner_first_photo_path).data.publicUrl
            : null
          convMap.set(entry.partner_id, {
            id: entry.partner_id,
            name: entry.partner_name ?? 'Unknown',
            avatar: photoUrl,
            lastMessage: entry.is_sent_by_me
              ? `You: ${entry.last_message}`
              : entry.last_message,
            time: formatRelativeShort(entry.last_message_at),
            unread: false,
          })
          partnerMap.set(entry.partner_id, {
            user_id: entry.partner_id,
            user_name: entry.partner_name ?? null,
            bio: (entry.bio as string | null | undefined) ?? null,
            birthday: (entry.birthday as string | null | undefined) ?? null,
            sports: (entry.sports as string[] | undefined) ?? [],
            rating: (entry.rating as number | null | undefined) ?? null,
            first_photo_path: entry.partner_first_photo_path ?? null,
            strava_ftp: entry.strava_ftp ?? null,
            strava_stats: entry.strava_stats ?? [],
          })
        }
        setConversations(convMap)
        setPartners(partnerMap)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [session?.access_token])

  useEffect(() => {
    fetch()
  }, [fetch])

  /**
   * Optimistically removes a partner's conversation from local state. Used
   * by the unmatch flow so the conversation list updates immediately
   * without waiting for a refetch.
   */
  const removePartner = useCallback((partnerId: string) => {
    setConversations((prev) => {
      if (!prev.has(partnerId)) return prev
      const next = new Map(prev)
      next.delete(partnerId)
      return next
    })
    setPartners((prev) => {
      if (!prev.has(partnerId)) return prev
      const next = new Map(prev)
      next.delete(partnerId)
      return next
    })
  }, [])

  return { conversations, partners, loading, error, refresh: fetch, removePartner }
}
