import { PiInfo } from 'react-icons/pi'

interface AboutMeCardProps {
  bio: string | null
  isEditing: boolean
  onBioChange: (bio: string) => void
  onEditClick: () => void
}

const MAX_BIO = 280

export function AboutMeCard({ bio, isEditing, onBioChange, onEditClick }: AboutMeCardProps) {
  return (
    <div className="bg-white border border-[rgba(254,242,242,0.5)] rounded-2xl shadow-[0px_8px_30px_0px_rgba(0,0,0,0.04)] p-[33px] flex flex-col gap-4 col-span-2">
      {/* Section heading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PiInfo size={24} className="text-[#dc2626]" />
          <h2 className="text-[#1d1a20] font-bold text-xl">About</h2>
        </div>
        {!isEditing && (
          <button
            onClick={onEditClick}
            className="text-[#dc2626] font-semibold text-sm hover:underline"
          >
            Edit
          </button>
        )}
      </div>

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
    </div>
  )
}
