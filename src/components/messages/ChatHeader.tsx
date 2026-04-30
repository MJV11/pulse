import type { Conversation } from '../../lib/types'
import { UserAvatar } from '../common/UserAvatar'

interface ChatHeaderProps {
  conversation: Conversation
  /**
   * When provided, the avatar + name region becomes a button that calls
   * this handler — used by the parent to open the profile detail modal.
   */
  onProfileClick?: () => void
}

/**
 * Frosted glass header bar for the active chat window.
 */
export function ChatHeader({ conversation, onProfileClick }: ChatHeaderProps) {
  return (
    <div className="absolute top-0 left-0 right-0 h-20 backdrop-blur-md bg-white/80 border-b border-[rgba(254,226,226,0.1)] flex items-center justify-between px-8 z-10">
      {/* Left: avatar + name + online status — clickable when onProfileClick is provided */}
      <button
        type="button"
        onClick={onProfileClick}
        disabled={!onProfileClick}
        className={`flex items-center gap-4 -ml-2 px-2 py-1 rounded-2xl transition-colors ${
          onProfileClick ? 'hover:bg-[#fef2f2]/40 cursor-pointer' : 'cursor-default'
        }`}
        aria-label={onProfileClick ? `View ${conversation.name}'s profile` : undefined}
      >
        <UserAvatar
          photoUrl={conversation.avatar}
          name={conversation.name}
          userId={conversation.id}
          size={40}
          rounded="full"
          className="shrink-0"
        />
        <div className="flex flex-col text-left">
          <h2 className="text-[#131b2e] text-[18px] font-normal leading-7">{conversation.name}</h2>
          {conversation.online && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#22c55e] rounded-full" />
              <span className="text-[#5c403a] text-xs font-medium tracking-[-0.6px] uppercase">
                Online
              </span>
            </div>
          )}
        </div>
      </button>

      {/* Right: action icons */}
      <div className="flex items-center gap-4">
      </div>
    </div>
  )
}