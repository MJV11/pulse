import { useState, useMemo } from 'react'
import type { Conversation, Message } from '../../lib/types'
import type { MatchItem } from '../../hooks/useMatches'
import { ConversationItem } from './ConversationItem'
import { NewMatchesCarousel } from './NewMatchesCarousel'
import { UserAvatar } from '../common/UserAvatar'
import { PiMagnifyingGlass, PiX } from 'react-icons/pi'

// ── Search types & helpers ────────────────────────────────────────────────────

interface SearchHit {
  conversationId: string
  name: string
  avatar: string | null
  /** Raw full text used to extract the snippet. */
  content: string
  isNameMatch: boolean
  /** Whether the matching message was sent by the viewer. */
  sentByMe?: boolean
  hitIndex: number // unique key
}

/**
 * Split `text` into [{text, isMatch}] parts so the caller can highlight every
 * occurrence of `query` (case-insensitive).
 */
function splitHighlight(text: string, query: string) {
  const parts: { text: string; isMatch: boolean }[] = []
  const lc = text.toLowerCase()
  const lq = query.toLowerCase()
  let cursor = 0
  let idx: number
  while ((idx = lc.indexOf(lq, cursor)) !== -1) {
    if (idx > cursor) parts.push({ text: text.slice(cursor, idx), isMatch: false })
    parts.push({ text: text.slice(idx, idx + query.length), isMatch: true })
    cursor = idx + query.length
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), isMatch: false })
  return parts
}

/**
 * Extract a ~80-char window around the first query occurrence so each result
 * row stays compact.
 */
function getSnippet(content: string, query: string, windowSize = 40): string {
  const idx = content.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return content
  const start = Math.max(0, idx - windowSize)
  const end = Math.min(content.length, idx + query.length + windowSize)
  return (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '')
}

function computeHits(
  query: string,
  conversations: Map<string, Conversation>,
  threads: Map<string, Message[]>,
): SearchHit[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  const hits: SearchHit[] = []
  let idx = 0

  for (const [id, conv] of conversations) {
    // Contact name match
    if (conv.name.toLowerCase().includes(q)) {
      hits.push({ conversationId: id, name: conv.name, avatar: conv.avatar, content: conv.name, isNameMatch: true, hitIndex: idx++ })
    }

    const thread = threads.get(id)
    if (thread) {
      for (const msg of thread) {
        if (msg.content.toLowerCase().includes(q)) {
          hits.push({ conversationId: id, name: conv.name, avatar: conv.avatar, content: msg.content, isNameMatch: false, sentByMe: msg.type === 'sent', hitIndex: idx++ })
        }
      }
    } else if (conv.lastMessage.toLowerCase().includes(q)) {
      // Thread not yet fetched — surface the last message snippet as a fallback
      hits.push({ conversationId: id, name: conv.name, avatar: conv.avatar, content: conv.lastMessage, isNameMatch: false, hitIndex: idx++ })
    }
  }

  return hits
}

// ── Search result item ────────────────────────────────────────────────────────

function SearchResultItem({
  hit,
  query,
  onClick,
}: {
  hit: SearchHit
  query: string
  onClick: () => void
}) {
  const snippet = hit.isNameMatch ? hit.name : getSnippet(hit.content, query)
  const parts = splitHighlight(snippet, query)

  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 px-4 py-3 rounded-2xl text-left hover:bg-[#fef2f2]/70 transition-colors"
    >
      <div className="shrink-0 mt-0.5">
        <UserAvatar
          photoUrl={hit.avatar}
          name={hit.name}
          userId={hit.conversationId}
          size={38}
          rounded="xl"
        />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[#131b2e] text-sm font-medium block truncate">{hit.name}</span>
        {hit.isNameMatch ? (
          <span className="text-[#94a3b8] text-xs">Contact</span>
        ) : (
          <span className="text-[#5c403a] text-xs leading-snug break-words">
            {hit.sentByMe && (
              <span className="text-[#94a3b8]">You: </span>
            )}
            {parts.map((p, i) =>
              p.isMatch ? (
                <mark
                  key={i}
                  className="bg-[#fef3c7] text-[#92400e] not-italic font-semibold rounded-sm px-[2px]"
                >
                  {p.text}
                </mark>
              ) : (
                <span key={i}>{p.text}</span>
              )
            )}
          </span>
        )}
      </div>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface ConversationListProps {
  conversations: Map<string, Conversation>
  recentMatches: MatchItem[]
  /** Loaded message threads, keyed by partner user ID. Used for full-text search. */
  threads: Map<string, Message[]>
  activeId?: string
  /** Shows skeleton rows while conversations are being fetched. */
  loadingConversations?: boolean
  /** Shows skeleton avatars in the New Matches carousel while matches are loading. */
  loadingMatches?: boolean
  onSelect: (id: string) => void
  onSelectMatch: (userId: string) => void
  /** Called when a search result is clicked — navigates directly to that chat. */
  onConversationSelect: (id: string) => void
}

/**
 * Left pane of the messages screen.
 * Layout (top → bottom):
 *   1. New Matches carousel (if any recent matches)
 *   2. Messages header + search bar
 *   3. Search results (when query is active) OR conversation items
 */
export function ConversationList({
  conversations,
  recentMatches,
  threads,
  activeId,
  loadingConversations = false,
  loadingMatches = false,
  onSelect,
  onSelectMatch,
  onConversationSelect,
}: ConversationListProps) {
  const [query, setQuery] = useState('')

  const hits = useMemo(
    () => computeHits(query, conversations, threads),
    [query, conversations, threads],
  )

  const isSearching = query.trim().length > 0

  return (
    <div className="w-full md:w-[384px] md:shrink-0 bg-white border-r border-[#f1f5f9] flex flex-col h-full">

      {/* ── New Matches (top section) ──────────────────────────────── */}
      {!isSearching && (loadingMatches || recentMatches.length > 0) && (
        loadingMatches
          ? <NewMatchesSkeleton />
          : <NewMatchesCarousel matches={recentMatches} onSelect={onSelectMatch} />
      )}

      {/* ── Messages header + search ───────────────────────────────── */}
      <div className="px-6 py-5 flex flex-col gap-4">
        {!isSearching && (
          <div className="flex items-center justify-between">
            <h1 className="text-[#131b2e] text-base font-semibold">Messages</h1>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <PiMagnifyingGlass
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280] pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-[#f4f2ff] rounded-2xl pl-10 pr-10 py-[13px] text-[#6b7280] text-sm placeholder:text-[#6b7280] outline-none border-none"
          />
          {isSearching && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#6b7280] transition-colors"
              aria-label="Clear search"
            >
              <PiX size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── Search results ─────────────────────────────────────────── */}
      {isSearching ? (
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Result count */}
          <p className="px-6 pb-2 text-[#94a3b8] text-xs font-medium">
            {hits.length === 0
              ? `No results for "${query}"`
              : `${hits.length} result${hits.length === 1 ? '' : 's'} for "${query}"`}
          </p>

          {/* Hits */}
          <div className="px-2 flex flex-col gap-0.5">
            {hits.map((hit) => (
              <SearchResultItem
                key={hit.hitIndex}
                hit={hit}
                query={query}
                onClick={() => {
                  onConversationSelect(hit.conversationId)
                  setQuery('')
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        /* ── Conversation list ──────────────────────────────────────── */
        <div className="flex-1 overflow-y-auto px-2 flex flex-col gap-1">
          {loadingConversations ? (
            <ConversationListSkeleton />
          ) : (
            <>
              {Array.from(conversations.values()).map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  active={conv.id === activeId}
                  onClick={() => onConversationSelect(conv.id)}
                  onAvatarClick={() => onSelect(conv.id)}
                />
              ))}

              {conversations.size === 0 && (
                <p className="text-center text-[#94a3b8] text-sm py-8">No conversations yet.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Skeleton components ────────────────────────────────────────────────────────

function NewMatchesSkeleton() {
  return (
    <div className="px-6 pt-5 pb-4 flex flex-col gap-3 border-b border-[#f1f5f9]">
      {/* "New Matches" label placeholder */}
      <div className="h-2.5 w-24 bg-[#f1f5f9] rounded-full animate-pulse" />
      <div className="flex gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-[7px] shrink-0">
            <div className="w-[52px] h-[52px] rounded-full bg-[#f1f5f9] animate-pulse" />
            <div className="h-2 w-9 bg-[#f1f5f9] rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ConversationListSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-3xl animate-pulse">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl bg-[#f1f5f9] shrink-0" />
          {/* Text lines */}
          <div className="flex-1 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="h-3 bg-[#f1f5f9] rounded-full" style={{ width: `${48 + (i % 3) * 16}px` }} />
              <div className="h-2 w-8 bg-[#f1f5f9] rounded-full shrink-0" />
            </div>
            <div className="h-3 bg-[#f1f5f9] rounded-full" style={{ width: `${80 + (i % 4) * 20}px` }} />
          </div>
        </div>
      ))}
    </>
  )
}
