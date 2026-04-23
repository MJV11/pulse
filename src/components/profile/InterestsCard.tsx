import { PROFILE_ICON_STAR } from '../../lib/assets'

interface InterestsCardProps {
  sports: string[]
  onEditClick: () => void
}

const CHIP_STYLES = [
  { bg: 'bg-[rgba(254,226,226,0.5)]', text: 'text-[#dc2626]' },
  { bg: 'bg-[rgba(252,231,243,0.5)]', text: 'text-[#db2777]' },
  { bg: 'bg-[#fef2f2]',              text: 'text-[#b91c1c]' },
  { bg: 'bg-[#fdf2f8]',              text: 'text-[#be185d]' },
]

/**
 * Sports / Interests bento card — populated from user_details.sports.
 */
export function InterestsCard({ sports, onEditClick }: InterestsCardProps) {
  return (
    <div className="bg-white border border-[rgba(254,242,242,0.5)] rounded-2xl shadow-[0px_8px_30px_0px_rgba(0,0,0,0.04)] p-[33px] flex flex-col gap-6">
      {/* Heading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={PROFILE_ICON_STAR} alt="" className="w-[17px] h-[16px] object-contain" />
          <h2 className="text-[#1d1a20] font-bold text-xl">Sports</h2>
        </div>
        <button
          onClick={onEditClick}
          className="text-[#dc2626] font-semibold text-sm hover:underline"
        >
          Edit
        </button>
      </div>

      {/* Tags */}
      {sports.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {sports.map((sport, i) => {
            const style = CHIP_STYLES[i % CHIP_STYLES.length]
            return (
              <span
                key={sport}
                className={`${style.bg} ${style.text} font-semibold text-[14px] px-4 py-2 rounded-full`}
              >
                {sport}
              </span>
            )
          })}
        </div>
      ) : (
        <p className="text-[#94a3b8] text-sm italic">No sports added yet.</p>
      )}

      {/* Add more */}
      <button
        onClick={onEditClick}
        className="w-full border border-dashed border-[#fecaca] rounded-2xl py-[13px] text-[#dc2626] font-semibold text-[14px] hover:bg-[#fef2f2]/50 transition-colors"
      >
        + Add More
      </button>
    </div>
  )
}
