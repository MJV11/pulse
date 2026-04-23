import type { Conversation, Message } from '../../lib/data'
import { ChatHeader } from './ChatHeader'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'

interface ChatWindowProps {
  conversation: Conversation
  messages: Message[]
  onSend?: (text: string) => void
}

/**
 * Right-pane chat window: sticky header, scrollable message stream, and input bar.
 */
export function ChatWindow({ conversation, messages, onSend }: ChatWindowProps) {
  return (
    <div className="flex-1 bg-white relative flex flex-col h-full overflow-hidden">
      <ChatHeader conversation={conversation} />

      {/* Date separator + messages */}
      <div className="absolute inset-0 top-20 bottom-[124px] overflow-y-auto px-8 py-8 flex flex-col gap-3">
        {/* Date separator */}
        <div className="flex justify-center mb-2">
          <span className="bg-[#f4f2ff] text-[#5c403a] text-xs font-medium px-4 py-[3px] rounded-full">
            Today
          </span>
        </div>

        {/* Message stream */}
        {messages.map((msg, idx) => {
          const prevMsg = messages[idx - 1]
          const showAvatar = !prevMsg || prevMsg.type !== msg.type
          return (
            <MessageBubble key={msg.id} message={msg} showAvatar={showAvatar} />
          )
        })}
      </div>

      <MessageInput onSend={onSend} />
    </div>
  )
}
