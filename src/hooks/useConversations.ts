import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import type { Conversation } from '../lib/data'

interface ConversationEntry {
  partner_id: string
  partner_name: string | null
  last_message: string
  last_message_at: string
  is_sent_by_me: boolean
}

interface ConversationsResponse {
  data: ConversationEntry[]
}

/** Generates a coloured SVG initials avatar as a data URI. */
function makeInitialsAvatar(name: string | null): string {
  const label = (name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const palette = ['#d90429', '#7c3aed', '#0369a1', '#b45309', '#065f46']
  const hash = (name ?? '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const fill = palette[hash % palette.length]
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56">`,
    `<rect width="56" height="56" rx="12" fill="${fill}"/>`,
    `<text x="28" y="36" text-anchor="middle" font-family="system-ui,sans-serif"`,
    ` font-weight="700" font-size="20" fill="white">${label}</text>`,
    `</svg>`,
  ].join('')
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
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
          (data ?? []).map((entry) => [
            entry.partner_id,
            {
              id: entry.partner_id,
              name: entry.partner_name ?? 'Unknown',
              avatar: makeInitialsAvatar(entry.partner_name),
              lastMessage: entry.is_sent_by_me
                ? `You: ${entry.last_message}`
                : entry.last_message,
              time: relativeTime(entry.last_message_at),
              unread: false,
            },
          ]),
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
