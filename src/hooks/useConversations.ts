import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import { supabase } from '../lib/supabase'
import { formatRelativeShort } from '../lib/time'
import type { Conversation } from '../lib/data'

interface ConversationEntry {
  partner_id: string
  partner_name: string | null
  /** Storage path of the partner's first gallery photo, or null. */
  partner_first_photo_path: string | null
  last_message: string
  last_message_at: string
  is_sent_by_me: boolean
  // Forward-compat: backend may include any other user_details columns here.
  [key: string]: unknown
}

interface ConversationsResponse {
  data: ConversationEntry[]
}

/**
 * Fetches the authenticated user's conversation list from the API and
 * returns it as the Map<string, Conversation> shape the existing UI expects.
 * Keys are partner UUIDs.
 */
export function useConversations() {
  const { session } = useAuth()
  const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map())
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
        const map = new Map<string, Conversation>(
          (data ?? []).map((entry) => {
            const photoUrl = entry.partner_first_photo_path
              ? supabase.storage
                  .from('gallery')
                  .getPublicUrl(entry.partner_first_photo_path).data.publicUrl
              : null
            return [
              entry.partner_id,
              {
                id: entry.partner_id,
                name: entry.partner_name ?? 'Unknown',
                avatar: photoUrl,
                lastMessage: entry.is_sent_by_me
                  ? `You: ${entry.last_message}`
                  : entry.last_message,
                time: formatRelativeShort(entry.last_message_at),
                unread: false,
              },
            ]
          }),
        )
        setConversations(map)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [session?.access_token])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { conversations, loading, error, refresh: fetch }
}
