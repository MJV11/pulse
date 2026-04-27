import type { Conversation } from '../../lib/data'
import type { MatchItem } from '../../hooks/useMatches'
import { ConversationItem } from './ConversationItem'
import { NewMatchesCarousel } from './NewMatchesCarousel'
import { MSG_ICON_FILTER } from '../../lib/assets'

interface ConversationListProps {
  conversations: Map<string, Conversation>
  recentMatches: MatchItem[]
  activeId?: string
  onSelect: (id: string) => void
}

/**
 * Left pane of the messages screen: new-matches carousel + conversation list.
 */
export function ConversationList({ conversations, recentMatches, activeId, onSelect }: ConversationListProps) {
  return (
    <div className="w-[384px] shrink-0 bg-white border-r border-[#f1f5f9] flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-[#131b2e] text-base font-normal">Messages</h1>
          <button>
            <img src={MSG_ICON_FILTER} alt="Filter" className="w-[18px] h-[18px] object-contain" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <img
            src="https://www.figma.com/api/mcp/asset/e20b6617-05a3-488f-a435-5390df17132d"
            alt=""
            className="absolute left-3 top-1/2 -translate-y-1/2 w-[13.5px] h-[13.5px] object-contain pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full bg-[#f4f2ff] rounded-2xl pl-10 pr-4 py-[14px] text-[#6b7280] text-base placeholder:text-[#6b7280] outline-none border-none"
          />
        </div>

        {/* Recent matches carousel — only shown when there are recent matches */}
        {recentMatches.length > 0 && (
          <NewMatchesCarousel matches={recentMatches} />
        )}
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 flex flex-col gap-1">
        {Array.from(conversations.values()).map((conv) => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            active={conv.id === activeId}
            onClick={() => onSelect(conv.id)}
          />
        ))}
      </div>
    </div>
  )
}
