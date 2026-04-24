import type { DiscoveryProfile } from '../../lib/data'

interface ProfileCardProps {
  profile: DiscoveryProfile
  onClick?: () => void
}

const GRADIENTS = [
  'linear-gradient(135deg, #d90429 0%, #ff4d6d 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
  'linear-gradient(135deg, #0369a1 0%, #38bdf8 100%)',
  'linear-gradient(135deg, #b45309 0%, #fbbf24 100%)',
  'linear-gradient(135deg, #065f46 0%, #34d399 100%)',
]

function gradientFor(id: string) {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return GRADIENTS[hash % GRADIENTS.length]
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Swipeable profile card with gradient overlay, name, location, and interest chips.
 * When no photo URL is provided the card shows a gradient background with
 * large initials instead — used for real users from the discovery API.
 */
export function ProfileCard({ profile, onClick }: ProfileCardProps) {
  const hasPhoto = !!profile.photo

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={`relative rounded-[32px] overflow-hidden shadow-[0px_20px_50px_0px_rgba(217,4,41,0.1)] w-full max-w-[500px] aspect-[3/4] ${onClick ? 'cursor-pointer' : ''}`}
      style={!hasPhoto ? { background: gradientFor(profile.id) } : undefined}
    >
      {/* Photo or ghost initials */}
      {hasPhoto ? (
        <img
          src={profile.photo}
          alt={profile.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white/25 font-extrabold text-[160px] leading-none select-none">
            {initials(profile.name)}
          </span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-8 pb-10 pt-8 flex flex-col gap-4">
        {/* Name + location */}
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            {/* Name row */}
            <div className="flex items-center gap-2">
              <h2 className="text-white font-extrabold text-[32px] tracking-tight leading-none">
                {profile.name}{profile.age ? `, ${profile.age}` : ''}
              </h2>
              {profile.verified && (
                <img
                  src="https://www.figma.com/api/mcp/asset/4ce539d9-ac5b-48ea-9a42-9e99adb737c9"
                  alt="Verified"
                  className="w-[22px] h-[21px] object-contain"
                />
              )}
            </div>
            {/* Distance */}
            <div className="flex items-center gap-2 opacity-90">
              <img
                src="https://www.figma.com/api/mcp/asset/39bf9eef-35ce-4368-94db-128385ffba0b"
                alt=""
                className="w-[9px] h-[12px] object-contain"
              />
              <span className="text-white font-semibold text-[14px]">{profile.distance}</span>
            </div>
          </div>

          {/* Info button */}
          <button
            onClick={(e) => { e.stopPropagation(); onClick?.() }}
            className="backdrop-blur-md bg-white/20 border border-white/30 rounded-full p-[9px] flex items-center justify-center"
          >
            <img
              src="https://www.figma.com/api/mcp/asset/02447170-0ed5-4e8a-a9bf-dd1ce3a39019"
              alt="Info"
              className="w-5 h-5 object-contain"
            />
          </button>
        </div>

        {/* Interest/sport chips */}
        <div className="flex gap-2 flex-wrap">
          {profile.interests.map((interest) => (
            <span
              key={interest}
              className="backdrop-blur-md bg-white/10 border border-white/10 rounded-full px-[13px] py-1 text-white font-medium text-xs"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
