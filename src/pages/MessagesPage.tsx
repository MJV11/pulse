import { useEffect, useState, useMemo, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ConversationList } from '../components/messages/ConversationList'
import { ChatWindow } from '../components/messages/ChatWindow'
import { useConversations } from '../hooks/useConversations'
import { useMatches } from '../hooks/useMatches'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import { supabase } from '../lib/supabase'
import type { Conversation, Message } from '../lib/data'

interface DbMessage {
  id: string
  from_user_id: string
  to_user_id: string
  content: string
  reacted_with: string | null
  created_at: string
  modified_at: string
}

interface ThreadResponse {
  data: DbMessage[]
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function dbMessageToMessage(msg: DbMessage, currentUserId: string): Message {
  return {
    id: msg.id,
    type: msg.from_user_id === currentUserId ? 'sent' : 'received',
    content: msg.content,
    time: formatTime(msg.created_at),
    reacted_with: msg.reacted_with ?? undefined,
  }
}

/** SVG initials data-URI fallback for users without a photo. */
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

interface MessagesLocationState {
  partnerId?: string
}

/**
 * Messages page — new-matches carousel (top) + conversation list (left) + chat window (right).
 *
 * When a match is clicked who has no existing conversation, we synthesize a
 * Conversation object from their match profile so the ChatWindow header renders
 * correctly and the user can send the first message.
 */
export function MessagesPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const requestedPartnerId =
    (location.state as MessagesLocationState | null)?.partnerId ?? null

  const { conversations, loading: convsLoading, refresh: refreshConversations } = useConversations()
  const { matches } = useMatches()
  // Initialize from router state so the chat opens immediately on navigation
  // from MatchesPage, even before conversations finish loading.
  const [activeId, setActiveId] = useState<string | null>(requestedPartnerId)
  const [threads, setThreads] = useState<Map<string, Message[]>>(new Map())
  const [threadLoading, setThreadLoading] = useState(false)

  // When we land here from a Match tap, force-select that partner and clear
  // the navigation state so a refresh doesn't keep re-opening the same chat.
  useEffect(() => {
    if (!requestedPartnerId) return
    setActiveId(requestedPartnerId)
    navigate(location.pathname, { replace: true, state: null })
  }, [requestedPartnerId, navigate, location.pathname])

  // Matches from the last 7 days for the new-matches carousel
  const recentMatches = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    return matches.filter((m) => new Date(m.matched_at).getTime() >= cutoff)
  }, [matches])

  // Synthetic Conversation objects for matches that have no message history yet.
  // These fill in the ChatWindow header when someone taps a new match.
  const matchConversations = useMemo<Map<string, Conversation>>(() => {
    const map = new Map<string, Conversation>()
    for (const m of matches) {
      if (!conversations.has(m.user.user_id)) {
        const photoUrl = m.user.first_photo_path
          ? supabase.storage.from('gallery').getPublicUrl(m.user.first_photo_path).data.publicUrl
          : null
        map.set(m.user.user_id, {
          id: m.user.user_id,
          name: m.user.user_name ?? 'Unknown',
          avatar: photoUrl ?? makeInitialsAvatar(m.user.user_name),
          lastMessage: '',
          time: '',
          unread: false,
        })
      }
    }
    return map
  }, [matches, conversations])

  // Auto-select the first real conversation once loaded
  useEffect(() => {
    if (!activeId && conversations.size > 0) {
      setActiveId(Array.from(conversations.keys())[0])
    }
  }, [conversations, activeId])

  // Fetch the message thread whenever activeId changes (skip if already cached)
  useEffect(() => {
    if (!activeId || !session?.access_token) return
    if (threads.has(activeId)) return

    let cancelled = false
    setThreadLoading(true)

    apiFetch<ThreadResponse>(`/messages/${activeId}`, session.access_token)
      .then(({ data }) => {
        if (cancelled) return
        const messages = (data ?? []).map((msg) => dbMessageToMessage(msg, session.user.id))
        setThreads((prev) => new Map(prev).set(activeId, messages))
      })
      .catch((err: Error) => console.error('Failed to load thread:', err))
      .finally(() => { if (!cancelled) setThreadLoading(false) })

    return () => { cancelled = true }
  }, [activeId, session?.access_token, threads])

  const handleSend = useCallback(async (text: string) => {
    if (!activeId || !session?.access_token) return

    const optimistic: Message = {
      id: crypto.randomUUID(),
      type: 'sent',
      content: text,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }
    setThreads((prev) => {
      const next = new Map(prev)
      next.set(activeId, [...(prev.get(activeId) ?? []), optimistic])
      return next
    })

    try {
      await apiFetch('/messages', session.access_token, {
        method: 'POST',
        body: JSON.stringify({ to_user_id: activeId, content: text }),
      })
      refreshConversations()
    } catch (err) {
      console.error('Failed to send message:', err)
      setThreads((prev) => {
        const next = new Map(prev)
        const thread = (prev.get(activeId) ?? []).filter((m) => m.id !== optimistic.id)
        next.set(activeId, thread)
        return next
      })
    }
  }, [activeId, session?.access_token, refreshConversations])

  // Look up in real conversations first, fall back to synthetic match conversation
  const activeConversation = activeId
    ? (conversations.get(activeId) ?? matchConversations.get(activeId))
    : undefined

  const activeMessages = (activeId ? threads.get(activeId) : undefined) ?? []

  return (
    <div className="h-screen overflow-hidden flex">
      <ConversationList
        conversations={conversations}
        recentMatches={recentMatches}
        activeId={activeId ?? undefined}
        onSelect={setActiveId}
        onSelectMatch={setActiveId}
      />

      {activeConversation ? (
        <ChatWindow
          conversation={activeConversation}
          messages={activeMessages}
          onSend={handleSend}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          {convsLoading || threadLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#dc2626] border-t-transparent animate-spin" />
              <span className="text-[#94a3b8] text-sm">Loading…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center max-w-xs">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #d90429 0%, #ff4d6d 100%)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-[#131b2e] font-semibold">No conversations yet</p>
              <p className="text-[#94a3b8] text-sm">
                Match with someone in Discovery and tap their name above to say hello.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
