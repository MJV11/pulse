import type { Conversation } from '../../lib/data'
import { UserAvatar } from '../common/UserAvatar'

interface ConversationItemProps {
  conversation: Conversation
  active?: boolean
  onClick?: () => void
}

/**
 * Single row in the conversation list.
 */
export function ConversationItem({ conversation, active, onClick }: ConversationItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-3xl text-left transition-colors ${
        active ? 'bg-[#fef2f2]' : 'hover:bg-[#fef2f2]/60'
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <UserAvatar
          photoUrl={conversation.avatar}
          name={conversation.name}
          userId={conversation.id}
          size={56}
          rounded="2xl"
        />
        {conversation.unread && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#dc2626] border-2 border-white rounded-full flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
          </span>
        )}
      </div>

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
    </button>
  )
}
