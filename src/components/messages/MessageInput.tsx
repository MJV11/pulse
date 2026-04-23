import { useState } from 'react'
import { MSG_ICON_ATTACH, MSG_ICON_EMOJI, MSG_ICON_IMAGE, MSG_ICON_SEND } from '../../lib/assets'

interface MessageInputProps {
  onSend?: (text: string) => void
}

/**
 * Frosted glass message input bar with attachment, emoji, image, and send buttons.
 */
export function MessageInput({ onSend }: MessageInputProps) {
  const [value, setValue] = useState('')

  function handleSend() {
    if (!value.trim()) return
    onSend?.(value.trim())
    setValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-6 absolute bottom-0 left-0 right-0">
      <div className="backdrop-blur-md bg-[rgba(244,242,255,0.5)] border border-[rgba(254,226,226,0.2)] rounded-3xl px-3 py-3 flex items-end gap-4">
        {/* Left action icons */}
        <div className="flex items-center gap-1 pb-1 shrink-0">
          <IconButton icon={MSG_ICON_ATTACH} label="Attach" />
          <IconButton icon={MSG_ICON_EMOJI} label="Emoji" />
          <IconButton icon={MSG_ICON_IMAGE} label="Image" />
        </div>

        {/* Text area */}
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          rows={1}
          className="flex-1 bg-transparent text-[#131b2e] text-base placeholder:text-[#6b7280] outline-none resize-none leading-[1.6] max-h-32 overflow-y-auto py-1"
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)] transition-opacity hover:opacity-90 active:opacity-75"
          style={{ background: 'linear-gradient(135deg, #ef233c 0%, #d90429 100%)' }}
          aria-label="Send"
        >
          <img src={MSG_ICON_SEND} alt="" className="w-[19px] h-[16px] object-contain" />
        </button>
      </div>
    </div>
  )
}

function IconButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="p-2 rounded-full hover:bg-[#f4f2ff] transition-colors" aria-label={label}>
      <img src={icon} alt={label} className="w-5 h-5 object-contain" />
    </button>
  )
}
