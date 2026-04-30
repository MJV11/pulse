import { useEffect, useState } from 'react'
import { PiX, PiChatCircleDots, PiHeartBreak } from 'react-icons/pi'
import type { ProfileDetailUser } from '../../lib/types'
import { ProfileDetailCard } from './ProfileDetailCard'
import { Button } from '../flowbite-proxy/Button'

interface UserProfileModalProps {
  user: ProfileDetailUser
  /**
   * Optional distance label rendered over the photo. Discovery passes a
   * "3.2 miles away" string here; matches/messages typically omit it.
   */
  distanceLabel?: string
  onClose: () => void
  /**
   * When provided, the modal renders a "Message" button at the bottom that
   * calls this. Used from the matches page (navigate to /messages) and the
   * messages page (switch the active conversation). When omitted (e.g. from
   * the chat header where you're already messaging this person) the bottom
   * action bar is hidden.
   */
  onMessage?: () => void
  /**
   * When provided, the modal renders an "Unmatch" affordance below the
   * Message button that walks the user through a confirmation step before
   * calling this. Should resolve once the unmatch is committed; the modal
   * closes itself afterwards.
   */
  onUnmatch?: () => Promise<void> | void
}

/**
 * Modal wrapper around `ProfileDetailCard`. Shows the same photo + info
 * layout used inline on Discovery, framed in a centered modal panel and
 * optionally with a "Message" CTA at the bottom.
 */
export function UserProfileModal({
  user,
  distanceLabel,
  onClose,
  onMessage,
  onUnmatch,
}: UserProfileModalProps) {
  /** Two-step confirm so an accidental tap doesn't nuke the match. */
  const [confirmingUnmatch, setConfirmingUnmatch] = useState(false)
  const [unmatching, setUnmatching] = useState(false)

  // Esc closes the modal — keep parity with the rest of the app's modal
  // conventions (e.g. MatchCelebration uses the same pattern).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleConfirmUnmatch() {
    if (!onUnmatch || unmatching) return
    setUnmatching(true)
    try {
      await onUnmatch()
      onClose()
    } catch (err) {
      console.error('Unmatch failed:', err)
      setUnmatching(false)
      setConfirmingUnmatch(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel — caps height so the content scrolls inside the modal rather
          than letting the panel grow off-screen on tall content. */}
      <div className="relative w-full max-w-[600px] max-h-[90vh] flex flex-col">
        {/* Close — floating over the panel */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-sm transition-colors"
          aria-label="Close"
        >
          <PiX size={20} className="text-[#64748b]" />
        </button>

        {/* Scrollable card body */}
        <div className="flex-1 overflow-y-auto rounded-3xl shadow-[0px_25px_60px_0px_rgba(0,0,0,0.3)]">
          <ProfileDetailCard user={user} distanceLabel={distanceLabel} unbounded form={'modal'} />
          {/* Bottom action bar (only shown when there's something to do) */}
          {(onMessage || onUnmatch) && (
            <div className="rounded-b-3xl px-6 py-4 bg-[#fbf8ff] flex flex-col gap-3">
              {onMessage && (
                <Button
                  onClick={() => {
                    onMessage()
                    onClose()
                  }}
                  color='pulse-primary'
                  size='lg'
                  className='w-full !rounded-2xl'
                >
                  <span className="flex items-center gap-2 h-[30px]">
                    <PiChatCircleDots size={18} />
                    Message
                  </span>
                </Button>
              )}

              {onUnmatch && !confirmingUnmatch && (
                <Button
                  onClick={() => setConfirmingUnmatch(true)}
                  color='pulse-tertiary'
                  size='lg'
                  className='w-full !rounded-2xl'
                  isProcessing={unmatching}
                >
                  <span className="flex items-center gap-2 h-[30px]">
                    <PiHeartBreak size={18} />
                    Unmatch
                  </span>
                </Button>
              )}

              {onUnmatch && confirmingUnmatch && (
                <div className="rounded-2xl border border-[#fecaca] bg-white p-4 flex flex-col gap-3">
                  <p className="text-[#1d1a20] font-semibold text-sm">
                    Unmatch {user.user_name ?? 'this user'}?
                  </p>
                  <p className="text-[#64748b] text-xs leading-relaxed">
                    You'll both be removed from each other's matches and your
                    message history will be deleted. This can't be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setConfirmingUnmatch(false)}
                      disabled={unmatching}
                      color='pulse-quaternary'
                      className='w-full !rounded-xl'
                    >
                      <span className="flex items-center gap-2 h-[20px]">
                        <PiX size={18} />
                        Cancel
                      </span>
                    </Button>
                    <Button
                      onClick={handleConfirmUnmatch}
                      disabled={unmatching}
                      isProcessing={unmatching}
                      color='pulse-tertiary'
                      className="!rounded-xl w-full"
                    >
                      <span className="flex items-center gap-2 h-[20px]">
                        <PiHeartBreak size={18} />
                        Unmatch
                      </span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
