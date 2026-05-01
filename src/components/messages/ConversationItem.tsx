import type { Conversation } from '../../lib/types'
import { UserAvatar } from '../common/UserAvatar'

interface ConversationItemProps {
  conversation: Conversation
  active?: boolean
  /** Opens the chat with this person. Triggered by clicking anywhere on the row. */
  onClick?: () => void
  /** Opens the profile modal. Triggered by clicking only the avatar. */
  onAvatarClick?: () => void
}

/**
 * Single row in the conversation list.
 * Clicking the row opens the chat; clicking the avatar opens the profile modal.
 */
export function ConversationItem({ conversation, active, onClick, onAvatarClick }: ConversationItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.() }}
      className={`w-full flex items-center gap-4 p-4 rounded-3xl text-left transition-colors cursor-pointer select-none ${
        active ? 'bg-[#fef2f2]' : 'hover:bg-[#fef2f2]/60'
      }`}
    >
      {/* Avatar — clicking just the avatar opens the profile modal */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onAvatarClick?.() }}
        className="relative shrink-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626]"
        aria-label={`View ${conversation.name}'s profile`}
        tabIndex={-1}
      >
        <UserAvatar
          photoUrl={conversation.avatar}
          name={conversation.name}
          userId={conversation.id}
          size={56}
          rounded="2xl"
        />
        {conversation.unread && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#dc2626] border-2 border-white rounded-full flex items-center justify-center pointer-events-none">
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
          </span>
        )}
      </button>

      {/* Text */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[#131b2e] text-base font-normal">{conversation.name}</span>
          <span
            className={`text-xs shrink-0 ml-2 ${
              conversation.unread ? 'text-[#dc2626] font-bold' : 'text-[#5c403a] font-medium'
            }`}
          >
            {conversation.time}
          </span>
        </div>
        <p
          className={`text-base truncate ${
            conversation.unread ? 'text-[#131b2e] font-semibold' : 'text-[#5c403a] font-normal'
          }`}
        >
          {conversation.lastMessage}
        </p>
      </div>
    </div>
  )
}
