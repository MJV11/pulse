import { useState, KeyboardEvent } from 'react'
import { PROFILE_ICON_STAR } from '../../lib/assets'

interface InterestsCardProps {
  sports: string[]
  isEditing: boolean
  onSportsChange: (sports: string[]) => void
  onEditClick: () => void
}

const CHIP_STYLES = [
  { bg: 'bg-[rgba(254,226,226,0.5)]', text: 'text-[#dc2626]' },
  { bg: 'bg-[rgba(252,231,243,0.5)]', text: 'text-[#db2777]' },
  { bg: 'bg-[#fef2f2]',              text: 'text-[#b91c1c]' },
  { bg: 'bg-[#fdf2f8]',              text: 'text-[#be185d]' },
]

const SPORT_SUGGESTIONS = [
  'Basketball', 'Soccer', 'Tennis', 'Running', 'Swimming', 'Cycling',
  'Volleyball', 'Baseball', 'Football', 'Golf', 'Yoga', 'Climbing',
  'Skiing', 'Surfing', 'Boxing', 'CrossFit',
]

export function InterestsCard({ sports, isEditing, onSportsChange, onEditClick }: InterestsCardProps) {
  const [sportInput, setSportInput] = useState('')

  function addSport(value: string) {
    const trimmed = value.trim()
    if (!trimmed || sports.includes(trimmed)) return
    onSportsChange([...sports, trimmed])
    setSportInput('')
  }

  function removeSport(sport: string) {
    onSportsChange(sports.filter((s) => s !== sport))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSport(sportInput)
    }
    if (e.key === 'Backspace' && !sportInput && sports.length > 0) {
      onSportsChange(sports.slice(0, -1))
    }
  }

  return (
    <div className="bg-white border border-[rgba(254,242,242,0.5)] rounded-2xl shadow-[0px_8px_30px_0px_rgba(0,0,0,0.04)] p-[33px] flex flex-col gap-4">
      {/* Heading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={PROFILE_ICON_STAR} alt="" className="w-[17px] h-[16px] object-contain" />
          <h2 className="text-[#1d1a20] font-bold text-xl">Sports</h2>
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

      {/* Sports chips (always shown) */}
      {sports.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {sports.map((sport, i) => {
            const style = CHIP_STYLES[i % CHIP_STYLES.length]
            return (
              <span
                key={sport}
                className={`${style.bg} ${style.text} font-semibold text-[14px] px-4 py-2 rounded-full flex items-center gap-1.5`}
              >
                {sport}
                {isEditing && (
                  <button
                    onClick={() => removeSport(sport)}
                    className="opacity-60 hover:opacity-100 leading-none"
                    aria-label={`Remove ${sport}`}
                  >
                    ×
                  </button>
                )}
              </span>
            )
          })}
        </div>
      ) : !isEditing ? (
        <p className="text-[#94a3b8] text-sm italic">No sports added yet.</p>
      ) : null}

      {isEditing ? (
        <div className="flex flex-col gap-3">
          {/* Input row */}
          <div className="flex gap-2">
            <input
              type="text"
              value={sportInput}
              onChange={(e) => setSportInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a sport and press Enter"
              className="flex-1 border border-[#fecaca] rounded-2xl px-4 py-2.5 text-[#1d1a20] text-sm outline-none focus:ring-2 focus:ring-[#dc2626]/30 placeholder:text-[#94a3b8]"
            />
            <button
              onClick={() => addSport(sportInput)}
              className="px-4 py-2.5 rounded-2xl text-white font-semibold text-sm shrink-0"
              style={{ background: 'linear-gradient(135deg, #d90429 0%, #ff4d6d 100%)' }}
            >
              Add
            </button>
          </div>

          {/* Suggestions */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[#94a3b8] text-xs font-medium">Suggestions</p>
            <div className="flex flex-wrap gap-1.5">
              {SPORT_SUGGESTIONS.filter((s) => !sports.includes(s)).map((s) => (
                <button
                  key={s}
                  onClick={() => addSport(s)}
                  className="bg-[#f8fafc] border border-[#e2e8f0] text-[#64748b] font-medium text-xs px-3 py-1.5 rounded-full hover:bg-[#fef2f2] hover:border-[#fecaca] hover:text-[#dc2626] transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={onEditClick}
          className="w-full border border-dashed border-[#fecaca] rounded-2xl py-[13px] text-[#dc2626] font-semibold text-[14px] hover:bg-[#fef2f2]/50 transition-colors"
        >
          + Add More
        </button>
      )}
    </div>
  )
}
