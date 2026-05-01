import { Button, TextInput } from '../flowbite-proxy'
import { PiShareNetwork } from 'react-icons/pi'
import { calculateAge, maxBirthdayForMinAge, minBirthday, MIN_AGE } from '../../lib/age'

interface HeroSectionProps {
  userName: string | null
  /** ISO YYYY-MM-DD birthday or null. */
  birthday: string | null
  isEditing: boolean
  /** When true, renders skeleton placeholders in place of the real content. */
  isLoading?: boolean
  onNameChange: (name: string) => void
  onBirthdayChange: (birthday: string) => void
  onEditClick: () => void
  onPreviewClick: () => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}


export function HeroSection({
  userName,
  birthday,
  isEditing,
  isLoading = false,
  onNameChange,
  onBirthdayChange,
  onEditClick,
  onPreviewClick,
  onSave,
  onCancel,
  saving,
}: HeroSectionProps) {
  const displayName = userName ?? 'Your Name'
  const age = calculateAge(birthday)
  const nameWithAge = age != null ? `${displayName}, ${age}` : displayName

  if (isLoading) {
    return (
      <div className="bg-white border border-[rgba(254,242,242,0.5)] rounded-2xl shadow-[0px_8px_30px_0px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-pulse">
          <div className="flex items-end gap-4 pb-2">
            <div className="h-8 w-56 bg-[#e2e8f0] rounded-lg" />
            <div className="h-4 w-24 bg-[#f1f5f9] rounded-lg" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-28 bg-[#fee2e2] rounded-2xl" />
            <div className="h-10 w-12 bg-[#f1f5f9] rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[rgba(254,242,242,0.5)] rounded-2xl shadow-[0px_8px_30px_0px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Profile info row */}
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        {/* Photo + name */}
        <div className="flex items-end gap-6">
          {/* Name */}
          <div className="flex flex-row items-end gap-4">
            {isEditing ? (
              <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6">
                <TextInput
                  value={userName ?? ''}
                  onChange={(e) => onNameChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSave()}
                  placeholder="Your name"
                  color="pulse-primary"
                  className="max-w-[580px]"
                />
                <label className="flex items-center gap-2 text-[#534342] text-sm font-medium">
                  <span>Birthday</span>
                  <TextInput
                    type="date"
                    value={birthday ?? ''}
                    onChange={(e) => onBirthdayChange(e.target.value)}
                    min={minBirthday()}
                    max={maxBirthdayForMinAge(MIN_AGE)}
                    color="pulse-primary"
                    className="max-w-[200px]"
                  />
                </label>
              </div>
            ) : (
              <h1 className="text-[#1d1a20] font-extrabold text-[32px] tracking-tight leading-none">
                {nameWithAge}
              </h1>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 flex-wrap">
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
              <Button
                onClick={onPreviewClick}
                color='pulse-quaternary'
              >
                Preview
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
