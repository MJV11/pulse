import { PiInfo, PiStarFill } from 'react-icons/pi'
import type { Gender } from '../../hooks/useProfile'

interface AboutMeCardProps {
  bio: string | null
  gender: Gender | null
  /** System-computed user rating (0–5), or null if no ratings yet. */
  rating: number | null
  isEditing: boolean
  /** When true, renders skeleton placeholders in place of the real content. */
  isLoading?: boolean
  onBioChange: (bio: string) => void
  onGenderChange: (gender: Gender) => void
  onEditClick: () => void
}

const MAX_BIO = 280

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'man', label: 'Man' },
  { value: 'woman', label: 'Woman' },
  { value: 'nonbinary', label: 'Non-binary' },
]

const GENDER_LABEL: Record<Gender, string> = {
  man: 'Man',
  woman: 'Woman',
  nonbinary: 'Non-binary',
}

export function AboutMeCard({
  bio,
  gender,
  rating,
  isEditing,
  isLoading = false,
  onBioChange,
  onGenderChange,
  onEditClick,
}: AboutMeCardProps) {
  return (
    <div className="bg-white border border-[rgba(254,242,242,0.5)] rounded-2xl shadow-[0px_8px_30px_0px_rgba(0,0,0,0.04)] p-[33px] flex flex-col gap-5 col-span-2">
      {/* Section heading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PiInfo size={24} className="text-[#dc2626]" />
          <h2 className="text-[#1d1a20] font-bold text-xl">About</h2>
        </div>
        {!isEditing && !isLoading && (
          <button
            onClick={onEditClick}
            className="text-[#dc2626] font-semibold text-sm hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {isLoading && <AboutMeCardLoading />}
      {!isLoading && <AboutMeCardContent
        bio={bio}
        gender={gender}
        rating={rating}
        isEditing={isEditing}
        onBioChange={onBioChange}
        onGenderChange={onGenderChange}
        onEditClick={onEditClick}
      />}
    </div>
  )
}

interface AboutMeCardContentProps {
  bio: string | null
  gender: Gender | null
  rating: number | null
  isEditing: boolean
  onBioChange: (bio: string) => void
  onGenderChange: (gender: Gender) => void
  onEditClick: () => void
}

function AboutMeCardContent({
  bio,
  gender,
  rating,
  isEditing,
  onBioChange,
  onGenderChange,
  onEditClick,
}: AboutMeCardContentProps) {
  return (
    <>
      {/* Bio */}
      {isEditing ? (
        <div className="flex flex-col gap-1.5">
          <textarea
            value={bio ?? ''}
            onChange={(e) => {
              if (e.target.value.length <= MAX_BIO) onBioChange(e.target.value)
            }}
            placeholder="What makes you, you?"
            rows={5}
            className="w-full border border-[#fecaca] rounded-2xl px-4 py-3 text-[#1d1a20] text-base outline-none focus:ring-2 focus:ring-[#dc2626]/30 placeholder:text-[#94a3b8] resize-none leading-relaxed"
          />
          <span className="text-[#94a3b8] text-xs text-right">
            {(bio ?? '').length}/{MAX_BIO}
          </span>
        </div>
      ) : bio ? (
        <p className="text-[#534342] font-medium text-[18px] leading-[1.625]">{bio}</p>
      ) : (
        <button
          onClick={onEditClick}
          className="flex items-center gap-2 text-[#94a3b8] font-medium text-base italic hover:text-[#dc2626] transition-colors text-left"
        >
          <span>+ Add a bio to let others know who you are…</span>
        </button>
      )}

      {/* Divider between bio and the metadata fields */}
      <div className="border-t border-[#f1f5f9]" />

      {/* Gender + Rating sit side-by-side as labelled metadata fields */}
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-[#534342] font-semibold text-xs uppercase tracking-[1.2px]">
            Gender
          </span>
          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((opt) => {
                const selected = gender === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => onGenderChange(opt.value)}
                    className={`px-4 py-2 rounded-full border font-semibold text-sm transition-colors ${
                      selected
                        ? 'border-[#dc2626] bg-[#fef2f2] text-[#dc2626]'
                        : 'border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#fef2f2]/50 hover:text-[#dc2626]'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          ) : gender ? (
            <p className="text-[#1d1a20] font-semibold text-base">{GENDER_LABEL[gender]}</p>
          ) : (
            <button
              onClick={onEditClick}
              className="text-left text-[#94a3b8] font-medium italic text-sm hover:text-[#dc2626] transition-colors"
            >
              + Add your gender
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[#534342] font-semibold text-xs uppercase tracking-[1.2px]">
            Rating
          </span>
          <RatingDisplay rating={rating} />
        </div>
      </div>
    </>
  )
}

/**
 * Skeleton mirroring the bio paragraph + divider + gender / rating row so
 * the card holds its shape while the profile loads.
 */
function AboutMeCardLoading() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      <div className="flex flex-col gap-2">
        <div className="h-4 w-full bg-[#f1f5f9] rounded" />
        <div className="h-4 w-11/12 bg-[#f1f5f9] rounded" />
        <div className="h-4 w-3/4 bg-[#f1f5f9] rounded" />
      </div>
      <div className="border-t border-[#f1f5f9]" />
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-16 bg-[#f1f5f9] rounded" />
          <div className="h-5 w-24 bg-[#e2e8f0] rounded-lg" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-3 w-12 bg-[#f1f5f9] rounded" />
          <div className="h-5 w-28 bg-[#e2e8f0] rounded-lg" />
        </div>
      </div>
    </div>
  )
}

function RatingDisplay({ rating }: { rating: number | null }) {
  if (rating == null) {
    return (
      <p className="text-[#94a3b8] font-medium italic text-sm">
        No rating yet
      </p>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <PiStarFill
            key={i}
            size={16}
            className={i < Math.round(rating) ? 'text-[#fbbf24]' : 'text-[#e5e7eb]'}
          />
        ))}
      </div>
      <span className="text-[#1d1a20] font-semibold text-base">{rating.toFixed(1)}</span>
    </div>
  )
}
