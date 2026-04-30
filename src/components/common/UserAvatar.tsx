import { gradientFor } from '../../lib'

interface UserAvatarProps {
  /** Public URL of the user's photo, or null/undefined to render the fallback. */
  photoUrl: string | null | undefined
  /** Display name — used for initials in the fallback. */
  name: string | null | undefined
  /**
   * Stable id used to deterministically pick a fallback gradient so the same
   * user always lands on the same colour.
   */
  userId: string
  /** Pixel size of the (square) avatar. Defaults to 56px. */
  size?: number
  /** Border radius. Defaults to `'2xl'`. */
  rounded?: 'full' | 'xl' | '2xl' | '3xl'
  /** Optional extra classes for the outer element (e.g. ring, border). */
  className?: string
  /** Optional alt text override. Defaults to `name`. */
  alt?: string
}

const RADIUS_CLASS: Record<NonNullable<UserAvatarProps['rounded']>, string> = {
  full: 'rounded-full',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
}

function initials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Square (or circular) user avatar with a single-source-of-truth fallback:
 * shows the photo when available, otherwise renders a deterministic
 * gradient block with the user's initials. Used everywhere we display
 * other users (conversation list, chat header, new matches carousel).
 */
export function UserAvatar({
  photoUrl,
  name,
  userId,
  size = 56,
  rounded = '2xl',
  className = '',
  alt,
}: UserAvatarProps) {
  const radiusClass = RADIUS_CLASS[rounded]
  const dim = { width: size, height: size }

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={alt ?? name ?? ''}
        className={`${radiusClass} object-cover ${className}`.trim()}
        style={dim}
        draggable={false}
      />
    )
  }

  return (
    <div
      className={`${radiusClass} flex items-center justify-center ${className}`.trim()}
      style={{ ...dim, background: gradientFor(userId) }}
      role="img"
      aria-label={alt ?? name ?? 'User'}
    >
      <span
        className="text-white font-bold leading-none select-none"
        style={{ fontSize: Math.max(10, Math.round(size * 0.34)) }}
      >
        {initials(name)}
      </span>
    </div>
  )
}
