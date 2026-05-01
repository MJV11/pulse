import { useState, useRef, useEffect } from 'react'
import { PiPaperPlaneRight } from 'react-icons/pi'
import { TextArea } from '../flowbite-proxy'

interface MessageInputProps {
  onSend?: (text: string) => void
}

/** Maximum height (px) before the textarea becomes scrollable instead of growing. */
const MAX_HEIGHT = 128

/**
 * Message input bar. The textarea starts as a single line and grows with content
 * up to MAX_HEIGHT, after which it scrolls internally.
 */
export function MessageInput({ onSend }: MessageInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Resize the textarea on every keystroke. Resetting to 'auto' first lets it
  // shrink back when lines are deleted.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const next = Math.min(el.scrollHeight, MAX_HEIGHT)
    el.style.height = `${next}px`
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden'
  }, [value])

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
    <div className="shrink-0 p-4 md:p-6 border-t border-[rgba(254,226,226,0.15)]">
      <div className="flex flex-row items-center backdrop-blur-md bg-[rgba(244,242,255,0.5)] border border-[rgba(254,226,226,0.2)] rounded-3xl p-2 flex items-end gap-3">
        <TextArea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          rows={1}
          color="pulse-primary"
          // Override Flowbite's min-h-[100px] default; height is driven by the ref above.
          className="flex-1 !min-h-0 resize-none !border-none !bg-transparent !shadow-none !ring-0 !rounded-none leading-[1.6] py-1 text-base"
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          className="w-8 h-8 md:w-10 md:h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)] transition-opacity hover:opacity-90 active:opacity-75"
          style={{ background: 'linear-gradient(135deg, #ef233c 0%, #d90429 100%)' }}
          aria-label="Send"
        >
          <PiPaperPlaneRight size={20} className="text-white" />
        </button>
      </div>
    </div>
  )
}
