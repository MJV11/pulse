import { Fragment } from 'react'
import type { Conversation, Message } from '../../lib/types'
import { ChatHeader } from './ChatHeader'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { formatDateSeparator, localDateKey } from '../../lib/time'

interface ChatWindowProps {
  conversation: Conversation
  messages: Message[]
  onSend?: (text: string) => void
  /**
   * Forwarded to the chat header so clicking the partner's avatar/name can
   * open the profile detail modal in the parent page.
   */
  onProfileClick?: () => void
  /**
   * Forwarded to the chat header as a mobile back-to-list button.
   */
  onBack?: () => void
}

/**
 * Right-pane chat window: sticky header, scrollable message stream, and input bar.
 *
 * Messages are grouped into per-day buckets in the viewer's local timezone so
 * the date pills (`Today`, `Yesterday`, weekday, full date) line up with the
 * user's calendar rather than UTC.
 */
export function ChatWindow({ conversation, messages, onSend, onProfileClick, onBack }: ChatWindowProps) {
  return (
    <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
      <ChatHeader conversation={conversation} onProfileClick={onProfileClick} onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-6 md:px-8 py-8 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex justify-center mb-2">
            <span className="bg-[#f4f2ff] text-[#5c403a] text-xs font-medium px-4 py-[3px] rounded-full">
              Say hello
            </span>
          </div>
        )}

        {messages.map((msg, idx) => {
          const prevMsg = messages[idx - 1]
          const showAvatar = !prevMsg || prevMsg.type !== msg.type

          // Insert a date separator whenever the local-day bucket changes.
          // Falls back gracefully when a message has no timestamp (e.g.
          // static demo data) — we only render a separator if we can.
          const currKey = msg.timestamp ? localDateKey(msg.timestamp) : null
          const prevKey = prevMsg?.timestamp ? localDateKey(prevMsg.timestamp) : null
          const showSeparator = !!currKey && currKey !== prevKey

          return (
            <Fragment key={msg.id}>
              {showSeparator && msg.timestamp && (
                <div className="flex justify-center my-2">
                  <span className="bg-[#f4f2ff] text-[#5c403a] text-xs font-medium px-4 py-[3px] rounded-full">
                    {formatDateSeparator(msg.timestamp)}
                  </span>
                </div>
              )}
              <MessageBubble message={msg} showAvatar={showAvatar} />
            </Fragment>
          )
        })}
      </div>

      <MessageInput onSend={onSend} />
    </div>
  )
}
