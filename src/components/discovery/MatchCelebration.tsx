import { useMemo } from 'react'
import { PiHeartFill, PiX } from 'react-icons/pi'

interface MatchCelebrationProps {
  /** Current user's primary photo URL, or null for an initials fallback. */
  myPhotoUrl: string | null
  /** Initial used in the "you" avatar fallback when no photo is available. */
  myInitial?: string
  /** Matched user's display name. */
  theirName: string
  /** Matched user's primary photo URL, or null for an initials fallback. */
  theirPhotoUrl: string | null
  onMessage: () => void
  onKeepSwiping: () => void
}

/**
 * Full-screen "It's a Match!" celebration with a choreographed entrance:
 *
 *   0ms      backdrop fades in, hearts start floating
 *   100ms    avatars slide in from the screen edges, settle tilted toward each other
 *   700ms    heart medallion pops between the avatars, ripple bursts outward
 *   600ms    "It's a Match" headline pops with a soft overshoot
 *   950ms    subtitle rises in
 *  1100ms    primary CTA rises in
 *  1200ms    secondary CTA rises in
 *
 * Keyframes are scoped via the `match-` class prefix so they don't collide
 * with the rest of the app.
 */
export function MatchCelebration({
  myPhotoUrl,
  myInitial = 'Y',
  theirName,
  theirPhotoUrl,
  onMessage,
  onKeepSwiping,
}: MatchCelebrationProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center match-backdrop">
      <style>{KEYFRAMES}</style>

      {/* Saturated brand gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, rgba(217,4,41,0.96) 0%, rgba(255,77,109,0.96) 100%)',
        }}
      />

      {/* Radial center glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.2)_0%,_transparent_70%)]" />

      {/* Background floating hearts */}
      <FloatingHearts />

      {/* Close (X) */}
      <button
        onClick={onKeepSwiping}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md flex items-center justify-center text-white transition-colors z-10"
        aria-label="Close"
      >
        <PiX size={20} />
      </button>

      {/* Content stack */}
      <div className="relative z-[1] flex flex-col items-center gap-10 px-10 text-center max-w-md w-full">
        {/* Heading */}
        <div className="flex flex-col items-center gap-2">
          <span className="match-eyebrow text-white/85 font-semibold text-xs tracking-[0.4em] uppercase">
            It's a Match
          </span>
          <h2 className="match-headline text-white font-extrabold text-5xl tracking-tight leading-[1.05]">
            You &amp; {theirName}
          </h2>
          <p className="match-subtitle text-white/80 text-sm mt-2">
            both pulsed for each other
          </p>
        </div>

        {/* Avatar pair + burst */}
        <div className="relative h-44 w-full flex items-center justify-center">
          {/* Expanding ripple rings behind */}
          <div className="match-burst absolute top-1/2 left-1/2 w-32 h-32 rounded-full border-2 border-white/70" />
          <div className="match-burst-2 absolute top-1/2 left-1/2 w-32 h-32 rounded-full border-2 border-white/50" />

          {/* Left avatar (me) — slides in from the left, tilts toward center */}
          <div className="match-avatar-left">
            <Avatar url={myPhotoUrl} fallbackChar={myInitial} />
          </div>

          {/* Heart medallion in the middle */}
          <div className="match-heart absolute top-1/2 left-1/2 w-14 h-14 rounded-full bg-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] flex items-center justify-center z-10">
            <PiHeartFill size={40} className="text-[rgba(217,4,41,0.96)]" />
          </div>

          {/* Right avatar (them) — slides in from the right, tilts toward center */}
          <div className="match-avatar-right">
            <Avatar url={theirPhotoUrl} fallbackChar={theirName[0] ?? '?'} />
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onMessage}
            className="match-cta-1 w-full py-4 rounded-2xl bg-white text-[#d90429] font-bold text-base tracking-tight hover:bg-white/95 active:scale-[0.98] transition-all shadow-[0_15px_40px_-10px_rgba(0,0,0,0.4)]"
          >
            Send a Message
          </button>
          <button
            onClick={onKeepSwiping}
            className="match-cta-2 w-full py-4 rounded-2xl border-2 border-white/40 text-white font-semibold text-base hover:bg-white/10 active:scale-[0.98] transition-all"
          >
            Keep Swiping
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Internal ─────────────────────────────────────────────────────────────── */

function Avatar({
  url,
  fallbackChar,
}: {
  url: string | null
  fallbackChar: string
}) {
  return (
    <div className="w-32 h-32 rounded-[28px] overflow-hidden border-4 border-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)]">
      {url ? (
        <img
          src={url}
          alt=""
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.25)' }}
        >
          <span className="text-white font-extrabold text-5xl">
            {(fallbackChar || '?').toUpperCase()}
          </span>
        </div>
      )}
    </div>
  )
}

/** Stable random-ish positions for floating background hearts. */
const HEART_CONFIGS = [
  { left: '6%', size: 24, delay: 200, duration: 4200 },
  { left: '18%', size: 16, delay: 1600, duration: 4800 },
  { left: '30%', size: 28, delay: 800, duration: 3800 },
  { left: '58%', size: 20, delay: 400, duration: 4400 },
  { left: '72%', size: 32, delay: 1200, duration: 4200 },
  { left: '86%', size: 18, delay: 300, duration: 4600 },
  { left: '46%', size: 14, delay: 2200, duration: 5000 },
  { left: '94%', size: 22, delay: 700, duration: 4400 },
]

function FloatingHearts() {
  // Memoize so React doesn't re-create the array on every render — keeps
  // animation timing stable while the celebration is open.
  const hearts = useMemo(() => HEART_CONFIGS, [])
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {hearts.map((c, i) => (
        <div
          key={i}
          className="absolute bottom-0 match-heart-float"
          style={{
            left: c.left,
            animationDelay: `${c.delay}ms`,
            animationDuration: `${c.duration}ms`,
          }}
        >
          <PiHeartFill size={c.size} className="text-white/35" />
        </div>
      ))}
    </div>
  )
}

/* ── Choreography ─────────────────────────────────────────────────────────── */
// Single CSS string injected once with the component. Class names are
// prefixed with `match-` so they don't conflict with anything else.
const KEYFRAMES = `
  .match-backdrop {
    animation: match-fade-in 280ms ease-out both;
  }

  .match-eyebrow {
    animation: match-rise-in 400ms ease-out 450ms both;
  }
  .match-headline {
    animation: match-pop-in 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 600ms both;
  }
  .match-subtitle {
    animation: match-rise-in 400ms ease-out 950ms both;
  }

  .match-avatar-left {
    animation: match-avatar-left-in 700ms cubic-bezier(0.16, 1, 0.3, 1) 100ms both;
    margin-right: -20px;
  }
  .match-avatar-right {
    animation: match-avatar-right-in 700ms cubic-bezier(0.16, 1, 0.3, 1) 100ms both;
    margin-left: -20px;
  }
  .match-heart {
    transform: translate(-50%, -50%) scale(0);
    animation: match-heart-pop 520ms cubic-bezier(0.34, 1.56, 0.64, 1) 700ms both;
  }
  .match-burst {
    animation: match-burst 900ms ease-out 700ms both;
  }
  .match-burst-2 {
    animation: match-burst 1100ms ease-out 850ms both;
  }

  .match-cta-1 {
    animation: match-rise-in 400ms ease-out 1100ms both;
  }
  .match-cta-2 {
    animation: match-rise-in 400ms ease-out 1200ms both;
  }

  .match-heart-float {
    animation-name: match-heart-float;
    animation-timing-function: ease-out;
    animation-iteration-count: infinite;
  }

  @keyframes match-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes match-rise-in {
    from { transform: translateY(16px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  @keyframes match-pop-in {
    0%   { transform: scale(0.4); opacity: 0; }
    100% { transform: scale(1);   opacity: 1; }
  }

  @keyframes match-avatar-left-in {
    0%   { transform: translateX(-100vw) rotate(-30deg); opacity: 0; }
    60%  { transform: translateX(8px)    rotate(-12deg); opacity: 1; }
    100% { transform: translateX(0)      rotate(-8deg);  opacity: 1; }
  }

  @keyframes match-avatar-right-in {
    0%   { transform: translateX(100vw)  rotate(30deg);  opacity: 0; }
    60%  { transform: translateX(-8px)   rotate(12deg);  opacity: 1; }
    100% { transform: translateX(0)      rotate(8deg);   opacity: 1; }
  }

  @keyframes match-heart-pop {
    0%   { transform: translate(-50%, -50%) scale(0);    opacity: 0; }
    60%  { transform: translate(-50%, -50%) scale(1.25); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1);    opacity: 1; }
  }

  @keyframes match-burst {
    0%   { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
    20%  { opacity: 0.9; }
    100% { transform: translate(-50%, -50%) scale(3.5); opacity: 0; }
  }

  @keyframes match-heart-float {
    0%   { transform: translateY(0)      scale(0.6); opacity: 0; }
    10%  { opacity: 0.8; }
    100% { transform: translateY(-110vh) scale(1);   opacity: 0; }
  }
`
