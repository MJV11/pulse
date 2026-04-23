import {
  DISCOVERY_BTN_BOOST,
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
 * Order: Rewind · Dislike · Super Pulse · Like · Boost
 */
export function ActionControls({
  onRewind,
  onDislike,
  onSuperPulse,
  onLike,
  onBoost,
}: ActionControlsProps) {
  return (
    <div className="flex items-center gap-6">
      {/* Rewind */}
      <ActionButton size="sm" onClick={onRewind} shadow="subtle">
        <img src={DISCOVERY_BTN_REWIND} alt="Rewind" className="w-[18px] h-[21px] object-contain" />
      </ActionButton>

      {/* Dislike */}
      <ActionButton size="lg" onClick={onDislike} shadow="normal">
        <img src={DISCOVERY_BTN_DISLIKE} alt="Dislike" className="w-[21px] h-[21px] object-contain" />
      </ActionButton>

      {/* Super Pulse */}
      <ActionButton size="md" onClick={onSuperPulse} shadow="subtle">
        <img src={DISCOVERY_BTN_STAR} alt="Super Pulse" className="w-[25px] h-[25px] object-contain" />
      </ActionButton>

      {/* Like */}
      <button
        onClick={onLike}
        className="w-20 h-20 rounded-full flex items-center justify-center shadow-[0px_10px_30px_0px_rgba(217,4,41,0.3)] transition-transform hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #d90429 0%, #ff4d6d 100%)' }}
        aria-label="Like"
      >
        {/* heart SVG inline since it's the primary CTA */}
        <svg width="30" height="28" viewBox="0 0 30 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 27L2.5 14C0.5 12 0 9.5 1 7.5C2 5.5 4 4 6.5 4C8.5 4 10.5 5 12 6.5L15 9.5L18 6.5C19.5 5 21.5 4 23.5 4C26 4 28 5.5 29 7.5C30 9.5 29.5 12 27.5 14L15 27Z" fill="white" />
        </svg>
      </button>

      {/* Boost */}
      <ActionButton size="sm" onClick={onBoost} shadow="subtle">
        <img src={DISCOVERY_BTN_BOOST} alt="Boost" className="w-[16px] h-[20px] object-contain" />
      </ActionButton>
    </div>
  )
}

interface ActionButtonProps {
  size: 'sm' | 'md' | 'lg'
  shadow: 'subtle' | 'normal'
  onClick?: () => void
  children: React.ReactNode
}

function ActionButton({ size, shadow, onClick, children }: ActionButtonProps) {
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
      aria-label="Action"
    >
      {children}
    </button>
  )
}
