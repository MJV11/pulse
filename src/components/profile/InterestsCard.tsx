import { useState, useEffect, KeyboardEvent } from 'react'
import { PiBicycle } from 'react-icons/pi'
import { Button, TextInput } from '../flowbite-proxy'

// Sport keyword matching — checked case-insensitively against each sport string
const CYCLING_KW = ['cycl', 'bike', 'bicycl', 'triathlon',  'gravel']
const RUNNING_KW = ['run', 'triathlon', 'track']
const SWIMMING_KW = ['swim',  'triathlon']

function matchesSport(sports: string[], keywords: string[]): boolean {
  return sports.some((s) => keywords.some((k) => s.toLowerCase().includes(k)))
}

function formatPace(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function parsePace(input: string): number | null {
  const m = input.trim().match(/^(\d{1,2}):([0-5]\d)$/)
  if (!m) return null
  const total = parseInt(m[1], 10) * 60 + parseInt(m[2], 10)
  return total > 0 ? total : null
}

interface InterestsCardProps {
  sports: string[]
  /** User self-reported FTP in watts, or null. */
  ftp: number | null
  /** User self-reported mile run pace in seconds, or null. */
  milePaceSeconds: number | null
  /** User self-reported 100-yard freestyle pace in seconds, or null. */
  swimPaceSeconds: number | null
  isEditing: boolean
  /** When true, renders skeleton placeholders in place of the real content. */
  isLoading?: boolean
  onSportsChange: (sports: string[]) => void
  onFtpChange: (value: number | null) => void
  onMilePaceChange: (value: number | null) => void
  onSwimPaceChange: (value: number | null) => void
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
  ftp,
  milePaceSeconds,
  swimPaceSeconds,
  isEditing,
  isLoading = false,
  onSportsChange,
  onFtpChange,
  onMilePaceChange,
  onSwimPaceChange,
  onEditClick,
}: InterestsCardProps) {
  const [sportInput, setSportInput] = useState('')

  // Local string state for pace/ftp inputs — kept as typed text until blur
  const [ftpInput, setFtpInput] = useState('')
  const [milePaceInput, setMilePaceInput] = useState('')
  const [swimPaceInput, setSwimPaceInput] = useState('')

  // Reset input strings whenever we enter edit mode so they reflect current saved values
  useEffect(() => {
    if (isEditing) {
      setFtpInput(ftp != null ? String(ftp) : '')
      setMilePaceInput(milePaceSeconds != null ? formatPace(milePaceSeconds) : '')
      setSwimPaceInput(swimPaceSeconds != null ? formatPace(swimPaceSeconds) : '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing])

  const showFtp = matchesSport(sports, CYCLING_KW)
  const showRunPace = matchesSport(sports, RUNNING_KW)
  const showSwimPace = matchesSport(sports, SWIMMING_KW)
  const hasAnyPerf = showFtp || showRunPace || showSwimPace

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
                  color="pulse-primary"
                  className="max-w-[200px]"
                />
                <Button
                  onClick={() => addSport(sportInput)}
                  color="pulse-primary"
                  size="md"
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

              {/* Performance setters — shown when the relevant sport is selected */}
              {hasAnyPerf && (
                <div className="border-t border-[#fee2e2]/60 pt-3 flex flex-col gap-3">
                  <p className="text-[#94a3b8] text-xs font-medium uppercase tracking-wide">
                    Performance
                  </p>
                  <div className="flex flex-col gap-2">
                    {showFtp && (
                      <PerfInput
                        label="FTP"
                        hint="watts"
                        value={ftpInput}
                        placeholder="e.g. 280"
                        onChange={setFtpInput}
                        onCommit={() => {
                          const n = parseInt(ftpInput, 10)
                          const valid = Number.isFinite(n) && n > 0 && n <= 2000
                          onFtpChange(valid ? n : null)
                          setFtpInput(valid ? String(n) : '')
                        }}
                      />
                    )}
                    {showRunPace && (
                      <PerfInput
                        label="Mile pace"
                        hint="/mi"
                        value={milePaceInput}
                        placeholder="e.g. 6:30"
                        onChange={setMilePaceInput}
                        onCommit={() => {
                          const parsed = parsePace(milePaceInput)
                          onMilePaceChange(parsed)
                          setMilePaceInput(parsed != null ? formatPace(parsed) : '')
                        }}
                      />
                    )}
                    {showSwimPace && (
                      <PerfInput
                        label="100yd free"
                        hint="/100yd"
                        value={swimPaceInput}
                        placeholder="e.g. 1:30"
                        onChange={setSwimPaceInput}
                        onCommit={() => {
                          const parsed = parsePace(swimPaceInput)
                          onSwimPaceChange(parsed)
                          setSwimPaceInput(parsed != null ? formatPace(parsed) : '')
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
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

interface PerfInputProps {
  label: string
  hint: string
  value: string
  placeholder: string
  onChange: (v: string) => void
  onCommit: () => void
}

function PerfInput({ label, hint, value, placeholder, onChange, onCommit }: PerfInputProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[#534342] font-semibold text-sm w-24 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 flex-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => e.key === 'Enter' && onCommit()}
          placeholder={placeholder}
          className="w-28 border border-[#fecaca] rounded-xl px-3 py-1.5 text-[#1d1a20] text-sm outline-none focus:ring-2 focus:ring-[#dc2626]/30 placeholder:text-[#94a3b8]"
        />
        <span className="text-[#94a3b8] text-xs font-medium">{hint}</span>
      </div>
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
