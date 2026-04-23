import { PROFILE_ICON_HEART } from '../../lib/assets'

interface AboutMeCardProps {
  bio: string | null
  onEditClick: () => void
}

/**
 * About Me bento card — bio text from user_details.
 */
export function AboutMeCard({ bio, onEditClick }: AboutMeCardProps) {
  return (
    <div className="bg-white border border-[rgba(254,242,242,0.5)] rounded-2xl shadow-[0px_8px_30px_0px_rgba(0,0,0,0.04)] p-[33px] flex flex-col gap-4 col-span-2">
      {/* Section heading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={PROFILE_ICON_HEART} alt="" className="w-[17px] h-[15px] object-contain" />
          <h2 className="text-[#1d1a20] font-bold text-xl">About Me</h2>
        </div>
        <button
          onClick={onEditClick}
          className="text-[#dc2626] font-semibold text-sm hover:underline"
        >
          Edit
        </button>
      </div>

      {bio ? (
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
