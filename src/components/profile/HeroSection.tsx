import {
  PROFILE_COVER,
  PROFILE_ICON_LOCATION,
  PROFILE_ICON_SHARE,
  PROFILE_EDIT_CAMERA,
} from '../../lib/assets'

interface HeroSectionProps {
  userName: string | null
  rating: number | null
  onEditClick: () => void
}

function makeInitialsAvatar(name: string | null): string {
  const label = (name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="148" height="148">`,
    `<rect width="148" height="148" rx="16" fill="#d90429"/>`,
    `<text x="74" y="96" text-anchor="middle" font-family="system-ui,sans-serif"`,
    ` font-weight="800" font-size="56" fill="white">${label}</text>`,
    `</svg>`,
  ].join('')
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/**
 * Hero section with cover photo, avatar, name, rating, and edit/share buttons.
 * Populated from the user_details table via props.
 */
export function HeroSection({ userName, rating, onEditClick }: HeroSectionProps) {
  const displayName = userName ?? 'Your Name'
  const avatarSrc = makeInitialsAvatar(userName)

  return (
    <div className="bg-white border border-[rgba(254,242,242,0.5)] rounded-2xl shadow-[0px_8px_30px_0px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Cover */}
      <div className="relative h-80 bg-gray-100">
        <img
          src={PROFILE_COVER}
          alt="Cover"
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
      </div>

      {/* Profile info row */}
      <div className="px-[33px] pb-[33px] -mt-24 flex items-end justify-between">
        {/* Avatar + name */}
        <div className="flex items-end gap-6">
          {/* Avatar card */}
          <div className="relative bg-white rounded-3xl p-[6px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1)]">
            <img
              src={avatarSrc}
              alt={displayName}
              className="w-[148px] h-[148px] rounded-2xl object-cover"
            />
            <button
              onClick={onEditClick}
              className="absolute -bottom-2 -right-2"
              aria-label="Edit photo"
            >
              <img src={PROFILE_EDIT_CAMERA} alt="Edit" className="w-[42px] h-[42px] object-contain" />
            </button>
          </div>

          {/* Name + rating */}
          <div className="pb-2 flex flex-col gap-1.5">
            <h1 className="text-[#1d1a20] font-extrabold text-[32px] tracking-tight leading-none">
              {displayName}
            </h1>
            {rating != null ? (
              <div className="flex items-center gap-1.5">
                {/* Star icons */}
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M7 1l1.618 3.28 3.617.527-2.618 2.551.618 3.601L7 9.25l-3.235 1.709.618-3.601L1.765 4.807l3.617-.527L7 1z"
                        fill={i < Math.round(rating) ? '#fbbf24' : '#e5e7eb'}
                      />
                    </svg>
                  ))}
                </div>
                <span className="text-[#534342] text-sm font-medium">{rating.toFixed(1)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <img src={PROFILE_ICON_LOCATION} alt="" className="w-3 h-[15px] object-contain" />
                <span className="text-[#534342] text-base">No rating yet</span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pb-2">
          <button
            onClick={onEditClick}
            className="bg-[#dc2626] text-white font-semibold text-[14px] px-6 py-[15px] rounded-2xl shadow-[0px_4px_14px_0px_rgba(217,4,41,0.3)] hover:opacity-90 transition-opacity"
          >
            Edit Profile
          </button>
          <button className="bg-[#fef2f2] p-3 rounded-2xl hover:bg-[#fee2e2] transition-colors">
            <img src={PROFILE_ICON_SHARE} alt="Share" className="w-[18px] h-[20px] object-contain" />
          </button>
        </div>
      </div>
    </div>
  )
}
