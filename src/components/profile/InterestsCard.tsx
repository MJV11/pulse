import { useState, KeyboardEvent } from 'react'
import { PiBicycle } from 'react-icons/pi'
import { Button, TextInput } from '../flowbite-proxy'

interface InterestsCardProps {
  sports: string[]
  isEditing: boolean
  /** When true, renders skeleton placeholders in place of the real content. */
  isLoading?: boolean
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

export function InterestsCard({
  sports,
  isEditing,
  isLoading = false,
  onSportsChange,
  onEditClick,
}: InterestsCardProps) {
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
    <div className="bg-white border border-[rgba(254,242,242,0.5)] rounded-2xl shadow-[0px_8px_30px_0px_rgba(0,0,0,0.04)] p-[33px] flex flex-col gap-4 col-span-2">
      {/* Heading — always rendered so the section identity is stable while loading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PiBicycle size={24} className="text-[#dc2626]" />
          <h2 className="text-[#1d1a20] font-bold text-xl">Sports</h2>
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

      {isLoading ? (
        <InterestsCardBodyLoading />
      ) : (
        <>
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
              <div className="flex flex-wrap gap-2">
                <TextInput
                  value={sportInput}
                  onChange={(e) => setSportInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search for a sport"
                  color="pulse"
                  className="max-w-[200px]"
                />
                <Button
                  onClick={() => addSport(sportInput)}
                  color="pulse-primary"
                  size="sm"
                >
                  Add
                </Button>
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
        </>
      )}
    </div>
  )
}

/**
 * Skeleton for the chip row + add-more button only — the card heading is
 * always rendered live so the section identity stays stable while loading.
 */
function InterestsCardBodyLoading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="flex flex-wrap gap-2">
        {[64, 80, 56, 72, 60].map((w, i) => (
          <div key={i} className="h-8 bg-[#fee2e2]/60 rounded-full" style={{ width: w }} />
        ))}
      </div>
      <div className="h-11 border border-dashed border-[#fecaca] rounded-2xl" />
    </div>
  )
}
