import type { Conversation } from '../../lib/data'
import { MSG_ICON_INFO, MSG_ICON_PHONE, MSG_ICON_VIDEO } from '../../lib/assets'

interface ChatHeaderProps {
  conversation: Conversation
}

/**
 * Frosted glass header bar for the active chat window.
 */
export function ChatHeader({ conversation }: ChatHeaderProps) {
  return (
    <div className="absolute top-0 left-0 right-0 h-20 backdrop-blur-md bg-white/80 border-b border-[rgba(254,226,226,0.1)] flex items-center justify-between px-8 z-10">
      {/* Left: avatar + name + online status */}
      <div className="flex items-center gap-4">
        <img
          src={conversation.avatar}
          alt={conversation.name}
          className="w-10 h-10 rounded-full object-cover shrink-0"
        />
        <div className="flex flex-col">
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
      </div>

      {/* Right: action icons */}
      <div className="flex items-center gap-4">
        <HeaderIconButton icon={MSG_ICON_PHONE} label="Phone call" />
        <HeaderIconButton icon={MSG_ICON_VIDEO} label="Video call" />
        <HeaderIconButton icon={MSG_ICON_INFO} label="Info" />
      </div>
    </div>
  )
}

function HeaderIconButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#fef2f2] transition-colors"
      aria-label={label}
    >
      <img src={icon} alt={label} className="w-[18px] h-[18px] object-contain" />
    </button>
  )
}
