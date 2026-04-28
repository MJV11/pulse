import { PiHeart, PiHeartDuotone, PiX } from 'react-icons/pi'
import {
  DISCOVERY_BTN_DISLIKE,
  DISCOVERY_BTN_REWIND,
  DISCOVERY_BTN_STAR,
} from '../../lib/assets'

interface ActionControlsProps {
  onRewind?: () => void
  onDislike?: () => void
  onSuperPulse?: () => void
  onLike?: () => void
  onBoost?: () => void
}

/**
 * Row of swipe-action buttons below the profile card.
 * Order: Rewind · Dislike · Super Pulse · Like
 *
 * Rewind and Super Pulse are only rendered when their handlers are
 * provided, which lets callers gate them (e.g. behind Pulse Premium).
 */
export function ActionControls({
  onRewind,
  onDislike,
  onSuperPulse,
  onLike,
}: ActionControlsProps) {
  return (
    <div className="flex items-center gap-6">
      {/* Rewind — premium-only */}
      {onRewind && (
        <ActionButton size="sm" onClick={onRewind} shadow="subtle" label="Rewind">
          <img src={DISCOVERY_BTN_REWIND} alt="" className="w-[18px] h-[21px] object-contain" />
        </ActionButton>
      )}

      {/* Dislike */}
      <ActionButton size="lg" onClick={onDislike} shadow="normal" label="Dislike">
        <PiX size={36} className='text-pink-600' />
      </ActionButton>

      {/* Super Pulse — premium-only */}
      {onSuperPulse && (
        <ActionButton size="md" onClick={onSuperPulse} shadow="subtle" label="Super Pulse">
          <img src={DISCOVERY_BTN_STAR} alt="" className="w-[25px] h-[25px] object-contain" />
        </ActionButton>
      )}

      {/* Like */}
      <button
        onClick={onLike}
        className="w-20 h-20 rounded-full flex items-center justify-center shadow-[0px_10px_30px_0px_rgba(217,4,41,0.3)] transition-transform hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #d90429 0%, #ff4d6d 100%)' }}
        aria-label="Like"
      >
        <PiHeart size={36} className='text-white' />
      </button>
    </div>
  )
}

interface ActionButtonProps {
  size: 'sm' | 'md' | 'lg'
  shadow: 'subtle' | 'normal'
  onClick?: () => void
  label: string
  children: React.ReactNode
}

function ActionButton({ size, shadow, onClick, label, children }: ActionButtonProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  }
  const shadowClasses = {
    subtle: 'shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]',
    normal: 'shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]',
  }

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses[size]} ${shadowClasses[shadow]} bg-white border border-[rgba(254,242,242,0.5)] rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95`}
      aria-label={label}
    >
      {children}
    </button>
  )
}
