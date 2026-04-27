import { useEffect, useState, useMemo } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { ConversationList } from '../components/messages/ConversationList'
import { ChatWindow } from '../components/messages/ChatWindow'
import { useConversations } from '../hooks/useConversations'
import { useMatches } from '../hooks/useMatches'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import type { Message } from '../lib/data'

// Shape of a raw message row returned by GET /api/messages/:userId
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

/**
 * Messages page — conversation list (left) + live chat thread (right).
 * Conversations and threads are backed by the messages DB table via the API.
 */
export function MessagesPage() {
  const { session } = useAuth()
  const { conversations, loading: convsLoading, refresh: refreshConversations } = useConversations()
  const { matches } = useMatches()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [threads, setThreads] = useState<Map<string, Message[]>>(new Map())
  const [threadLoading, setThreadLoading] = useState(false)

  // Matches from the last 7 days to show in the new-matches carousel
  const recentMatches = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    return matches.filter((m) => new Date(m.matched_at).getTime() >= cutoff)
  }, [matches])

  // Auto-select the first conversation once loaded
  useEffect(() => {
    if (!activeId && conversations.size > 0) {
      setActiveId(Array.from(conversations.keys())[0])
    }
  }, [conversations, activeId])

  // Fetch the thread whenever the active conversation changes
  useEffect(() => {
    if (!activeId || !session?.access_token) return
    if (threads.has(activeId)) return

    let cancelled = false
    setThreadLoading(true)

    apiFetch<ThreadResponse>(`/messages/${activeId}`, session.access_token)
      .then(({ data }) => {
        if (cancelled) return
        const messages = (data ?? []).map((msg) =>
          dbMessageToMessage(msg, session.user.id),
        )
        setThreads((prev) => new Map(prev).set(activeId, messages))
      })
      .catch((err: Error) => console.error('Failed to load thread:', err))
      .finally(() => {
        if (!cancelled) setThreadLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeId, session?.access_token, threads])

  async function handleSend(text: string) {
    if (!activeId || !session?.access_token) return

    // Optimistic update — add bubble immediately
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
      // Roll back the optimistic message on failure
      setThreads((prev) => {
        const next = new Map(prev)
        const thread = (prev.get(activeId) ?? []).filter((m) => m.id !== optimistic.id)
        next.set(activeId, thread)
        return next
      })
    }
  }

  const activeConversation = activeId ? conversations.get(activeId) : undefined
  const activeMessages = (activeId ? threads.get(activeId) : undefined) ?? []

  return (
    <div className="flex h-screen overflow-hidden bg-[#fbf8ff]">
      <Sidebar variant="messages" />

      <div className="ml-[288px] flex flex-1 overflow-hidden">
        <ConversationList
          conversations={conversations}
          recentMatches={recentMatches}
          activeId={activeId ?? undefined}
          onSelect={(id) => setActiveId(id)}
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
              <span className="text-[#94a3b8]">No conversations yet</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
