import type { Message } from '../../lib/data'

interface MessageBubbleProps {
  message: Message
  /** Show avatar only for received messages when provided */
  showAvatar?: boolean
}

/**
 * Individual chat message bubble — handles sent, received, and image messages.
 * An emoji reaction (reacted_with) floats as a pill below the bubble when present.
 */
export function MessageBubble({ message, showAvatar = true }: MessageBubbleProps) {
  const isSent = message.type === 'sent'

  return (
    <div className={`flex items-end gap-3 ${isSent ? 'flex-row-reverse' : 'flex-row'} max-w-[72%] ${isSent ? 'self-end' : 'self-start'}`}>
      {/* Avatar (received only) */}
      {!isSent && showAvatar && message.avatar && (
        <img
          src={message.avatar}
          alt=""
          className="w-8 h-8 rounded-full object-cover shrink-0"
        />
      )}
      {!isSent && (!showAvatar || !message.avatar) && (
        <div className="w-8 shrink-0" />
      )}

      {/* Bubble + optional reaction */}
      <div className="flex flex-col gap-1">
        {message.image ? (
          <SentImageBubble message={message} />
        ) : isSent ? (
          <SentBubble message={message} />
        ) : (
          <ReceivedBubble message={message} />
        )}

        {message.reacted_with && (
          <span
            className={`text-sm px-2 py-0.5 rounded-full bg-white border border-[#f1f5f9] shadow-sm w-fit ${isSent ? 'self-end' : 'self-start'}`}
          >
            {message.reacted_with}
          </span>
        )}
      </div>
    </div>
  )
}

function ReceivedBubble({ message }: { message: Message }) {
  return (
    <div className="bg-[#f4f2ff] rounded-tl-2xl rounded-tr-2xl rounded-br-2xl px-4 py-3 flex flex-col gap-2">
      <p className="text-[#131b2e] text-base font-normal leading-[1.6] whitespace-pre-line">
        {message.content}
      </p>
      {message.time && (
        <span className="text-[#5c403a] text-[10px] font-normal">{message.time}</span>
      )}
    </div>
  )
}

function SentBubble({ message }: { message: Message }) {
  return (
    <div
      className="rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl px-4 py-3 flex flex-col gap-2 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)]"
      style={{ background: 'linear-gradient(130.66deg, #ef233c 0%, #d90429 100%)' }}
    >
      <p className="text-white text-base font-normal leading-[1.6] whitespace-pre-line">
        {message.content}
      </p>
      {message.time && (
        <span className="text-white/70 text-[10px] font-normal text-right">{message.time}</span>
      )}
    </div>
  )
}

function SentImageBubble({ message }: { message: Message }) {
  return (
    <div className="flex flex-col gap-2">
      {/* Image container */}
      <div className="bg-white border border-[#fef2f2] rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl p-[5px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)]">
        <img
          src={message.image}
          alt="Sent attachment"
          className="rounded-xl w-full h-48 object-cover"
        />
      </div>
      {/* Caption bubble */}
      <div
        className="rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl px-4 py-4 flex flex-col gap-2 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)]"
        style={{ background: 'linear-gradient(134.85deg, #ef233c 0%, #d90429 100%)' }}
      >
        <p className="text-white text-base font-normal leading-[1.6]">{message.content}</p>
        {message.time && (
          <span className="text-white/70 text-[10px] font-normal text-right">{message.time}</span>
        )}
      </div>
    </div>
  )
}
