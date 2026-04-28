import {
  PROFILE_ICON_LOCATION,
} from '../../lib/assets'
import { Button } from '../flowbite-proxy'
import { PiShareNetwork } from 'react-icons/pi'

interface HeroSectionProps {
  userName: string | null
  rating: number | null
  isEditing: boolean
  onNameChange: (name: string) => void
  onEditClick: () => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}


export function HeroSection({
  userName,
  rating,
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
      {/* Profile info row */}
      <div className="p-6 flex items-end justify-between">
        {/* Photo + name */}
        <div className="flex items-end gap-6">
          {/* Name + rating */}
          <div className="pb-2 flex flex-row items-end gap-4">
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
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <Button
                onClick={onCancel}
                disabled={saving}
                color="alt"
              >
                Cancel
              </Button>
              <Button
                onClick={onSave}
                disabled={saving || !userName?.trim()}
                isProcessing={saving}
                color='pulse-primary'
              >
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={onEditClick}
                color='pulse-primary'
              >
                Edit Profile
              </Button>
              <Button color='alt'>
                <PiShareNetwork size={20} />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
