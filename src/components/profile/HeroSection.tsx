import {
  PROFILE_COVER,
  PROFILE_ICON_LOCATION,
  PROFILE_ICON_SHARE,
} from '../../lib/assets'

interface HeroSectionProps {
  userName: string | null
  rating: number | null
  photoUrl: string | null
  isEditing: boolean
  onNameChange: (name: string) => void
  onEditClick: () => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}

function makeInitials(name: string | null): string {
  return (name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function HeroSection({
  userName,
  rating,
  photoUrl,
  isEditing,
  onNameChange,
  onEditClick,
  onSave,
  onCancel,
  saving,
}: HeroSectionProps) {
  const displayName = userName ?? 'Your Name'

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
        {/* Photo + name */}
        <div className="flex items-end gap-6">
          {/* Photo card */}
          <div className="bg-white rounded-3xl p-[6px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1)] shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={displayName}
                className="w-[148px] h-[148px] rounded-2xl object-cover"
              />
            ) : (
              <div
                className="w-[148px] h-[148px] rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #d90429 0%, #ff4d6d 100%)' }}
              >
                <span className="text-white font-extrabold text-5xl select-none">
                  {makeInitials(userName)}
                </span>
              </div>
            )}
          </div>

          {/* Name + rating */}
          <div className="pb-2 flex flex-col gap-1.5">
            {isEditing ? (
              <input
                autoFocus
                type="text"
                value={userName ?? ''}
                onChange={(e) => onNameChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSave()}
                placeholder="Your name"
                className="text-[#1d1a20] font-extrabold text-[28px] tracking-tight leading-none border-b-2 border-[#dc2626] bg-transparent outline-none placeholder:text-[#94a3b8] w-full max-w-[280px]"
              />
            ) : (
              <h1 className="text-[#1d1a20] font-extrabold text-[32px] tracking-tight leading-none">
                {displayName}
              </h1>
            )}
            {rating != null ? (
              <div className="flex items-center gap-1.5">
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
          {isEditing ? (
            <>
              <button
                onClick={onCancel}
                disabled={saving}
                className="border border-[#e2e8f0] text-[#64748b] font-semibold text-[14px] px-6 py-[15px] rounded-2xl hover:bg-[#f8fafc] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={saving || !userName?.trim()}
                className="bg-[#dc2626] text-white font-semibold text-[14px] px-6 py-[15px] rounded-2xl shadow-[0px_4px_14px_0px_rgba(217,4,41,0.3)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Saving…
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onEditClick}
                className="bg-[#dc2626] text-white font-semibold text-[14px] px-6 py-[15px] rounded-2xl shadow-[0px_4px_14px_0px_rgba(217,4,41,0.3)] hover:opacity-90 transition-opacity"
              >
                Edit Profile
              </button>
              <button className="bg-[#fef2f2] p-3 rounded-2xl hover:bg-[#fee2e2] transition-colors">
                <img src={PROFILE_ICON_SHARE} alt="Share" className="w-[18px] h-[20px] object-contain" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
