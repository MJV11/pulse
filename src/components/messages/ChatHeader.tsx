import type { Conversation } from '../../lib/types'
import { UserAvatar } from '../common/UserAvatar'
import { PiArrowLeft } from 'react-icons/pi'

interface ChatHeaderProps {
  conversation: Conversation
  /**
   * When provided, the avatar + name region becomes a button that calls
   * this handler — used by the parent to open the profile detail modal.
   */
  onProfileClick?: () => void
  /**
   * Mobile-only back button handler. When provided, a back arrow is shown
   * on the left of the header (hidden on desktop) to return to the conversation list.
   */
  onBack?: () => void
}

/**
 * Frosted glass header bar for the active chat window.
 */
export function ChatHeader({ conversation, onProfileClick, onBack }: ChatHeaderProps) {
  return (
    <div className="h-20 shrink-0 backdrop-blur-md bg-white/80 border-b border-[rgba(254,226,226,0.1)] flex items-center justify-between px-4 md:px-8 z-10">
      {/* Left: optional back button (mobile) + avatar + name */}
      <div className="flex items-center gap-1">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="md:hidden -ml-1 p-2 rounded-xl text-[#64748b] hover:bg-[#fef2f2]/40 transition-colors"
            aria-label="Back to conversations"
          >
            <PiArrowLeft size={20} />
          </button>
        )}
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
      </div>

      {/* Right: action icons */}
      <div className="flex items-center gap-4">
      </div>
    </div>
  )
}