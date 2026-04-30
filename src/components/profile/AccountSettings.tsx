import { useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { StravaIntegrationRow } from './StravaIntegrationRow'
import {
  PiBell,
  PiCaretDown,
  PiCaretRight,
  PiCaretRightBold,
  PiGear,
  PiHeart,
  PiLock,
  PiSignOutBold,
} from 'react-icons/pi'
import type { LookingFor } from '../../hooks/useProfile'

interface SettingRow {
  id: string
  icon: React.ReactNode
  iconBg: string
  title: string
  description: string
  type: 'toggle' | 'chevron'
}

const SETTINGS_ROWS = new Map<string, SettingRow>([
  [
    'notifications',
    {
      id: 'notifications',
      icon: <PiBell size={26} className="text-[#db2777]" />,
      iconBg: 'bg-[#fee2e2]',
      title: 'Push Notifications',
      description: 'Messages, matches, and app updates',
      type: 'toggle',
    },
  ],
  [
    'privacy',
    {
      id: 'privacy',
      icon: <PiLock size={26} className="text-[#DB2777]" />,
      iconBg: 'bg-[#fce7f3]',
      title: 'Privacy & Safety',
      description: 'Manage blocked users and visibility',
      type: 'chevron',
    },
  ],
  [
    'subscription',
    {
      id: 'subscription',
      icon: <PiCaretRightBold size={26} className="text-[#db2777]" />,
      iconBg: 'bg-[#fee2e2]',
      title: 'Subscription',
      description: 'Pulse Gold • Active until Oct 2024',
      type: 'chevron',
    },
  ],
])

const LOOKING_FOR_OPTIONS: { value: LookingFor; label: string }[] = [
  { value: 'man', label: 'Men' },
  { value: 'woman', label: 'Women' },
  { value: 'nonbinary', label: 'Non-binary' },
  { value: 'all', label: 'Everyone' },
]

const LOOKING_FOR_LABEL: Record<LookingFor, string> = {
  man: 'Men',
  woman: 'Women',
  nonbinary: 'Non-binary people',
  all: 'Everyone',
}

interface AccountSettingsProps {
  /** Current looking-for preference, or null if the user hasn't picked one. */
  lookingFor: LookingFor | null
  /** Minimum age preference (defaults to 18 if not yet stored). */
  minAgePref: number
  /** Maximum age preference (defaults to 99 if not yet stored). */
  maxAgePref: number
  /** Minimum FTP preference in watts (defaults to 50 if not yet stored). */
  minFtpPref: number
  /** Maximum FTP preference in watts (defaults to 500 if not yet stored). */
  maxFtpPref: number
  /** When true, hides users without a known Strava FTP from discovery. */
  requireFtp: boolean
  /** When true, renders skeleton placeholders in place of the real content. */
  isLoading?: boolean
  /**
   * Persist a new looking-for value. Resolves once the change is saved so the
   * row can show a brief saving state. The parent owns the API call so this
   * row stays a dumb settings list.
   */
  onLookingForChange: (next: LookingFor) => Promise<void> | void
  /** Persist updated age range preferences. Called on slider release. */
  onAgePrefsChange: (min: number, max: number) => Promise<void> | void
  /**
   * Persist updated FTP range + require-FTP toggle. Called on slider
   * release and on toggle flip. The toggle and slider are committed
   * together because the require flag often pairs with an explicit range.
   */
  onFtpPrefsChange: (min: number, max: number, requireFtp: boolean) => Promise<void> | void
}

export function AccountSettings({
  lookingFor,
  minAgePref,
  maxAgePref,
  minFtpPref,
  maxFtpPref,
  requireFtp,
  isLoading = false,
  onLookingForChange,
  onAgePrefsChange,
  onFtpPrefsChange,
}: AccountSettingsProps) {
  const { signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const [toggleState, setToggleState] = useState(
    new Map<string, boolean>([['notifications', true]])
  )
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [savingPref, setSavingPref] = useState(false)

  function handleToggle(id: string) {
    setToggleState((prev) => {
      const next = new Map(prev)
      next.set(id, !prev.get(id))
      return next
    })
  }

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
  }

  async function handleSelectLookingFor(value: LookingFor) {
    if (savingPref || value === lookingFor) return
    setSavingPref(true)
    try {
      await onLookingForChange(value)
    } finally {
      setSavingPref(false)
    }
  }

  return (
    <div className="bg-white border border-[rgba(254,242,242,0.5)] rounded-2xl shadow-[0px_8px_30px_0px_rgba(0,0,0,0.04)] p-[33px] flex flex-col gap-8 col-span-4">
      {/* Heading — always rendered so the section identity is stable while loading */}
      <div className="flex items-center gap-2">
        <PiGear size={24} className="text-[#db2777]" />
        <h2 className="text-[#1d1a20] font-bold text-xl">Account Settings</h2>
      </div>

      {isLoading ? (
        <AccountSettingsBodyLoading />
      ) : (
        <>
          {/* Settings rows */}
          <div className="flex flex-col gap-6">
            {/* Dating Preferences — expandable submenu for the looking-for selector,
                age range, and Strava FTP range */}
            <PreferencesRow
              lookingFor={lookingFor}
              minAgePref={minAgePref}
              maxAgePref={maxAgePref}
              minFtpPref={minFtpPref}
              maxFtpPref={maxFtpPref}
              requireFtp={requireFtp}
              open={preferencesOpen}
              saving={savingPref}
              onToggleOpen={() => setPreferencesOpen((o) => !o)}
              onSelect={handleSelectLookingFor}
              onAgePrefsChange={onAgePrefsChange}
              onFtpPrefsChange={onFtpPrefsChange}
            />

            {Array.from(SETTINGS_ROWS.values()).map((row) => (
              <SettingRowItem
                key={row.id}
                row={row}
                toggled={toggleState.get(row.id) ?? false}
                onToggle={() => handleToggle(row.id)}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-[#f1f5f9]" />

          {/* Integrations */}
          <div className="flex flex-col gap-3">
            <h3 className="text-[#534342] font-semibold text-xs uppercase tracking-[1.2px] px-4">
              Integrations
            </h3>
            <StravaIntegrationRow />
          </div>

          {/* Divider */}
          <div className="border-t border-[#f1f5f9]" />

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[#fef2f2]/40 transition-colors w-full text-left disabled:opacity-60"
          >
            <div className="bg-[#fef2f2] w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
              <PiSignOutBold size={20} className="text-[#db2777]" />
            </div>
            <div className="flex flex-col gap-px">
              <span className="text-[#db2777] font-semibold text-[14px]">
                {signingOut ? 'Signing out…' : 'Sign Out'}
              </span>
              <span className="text-[#94a3b8] font-medium text-xs">Log out of your account</span>
            </div>
          </button>
        </>
      )}
    </div>
  )
}

interface SettingRowItemProps {
  row: SettingRow
  toggled: boolean
  onToggle: () => void
}

function SettingRowItem({ row, toggled, onToggle }: SettingRowItemProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-[#fef2f2]/30 transition-colors">
      {/* Icon + text */}
      <div className="flex items-center gap-4">
        <div className={`${row.iconBg} text-[#db2777] w-12 h-12 rounded-2xl flex items-center justify-center shrink-0`}>
          {row.icon}
        </div>
        <div className="flex flex-col gap-px">
          <span className="text-[#1d1a20] font-semibold text-[14px]">{row.title}</span>
          <span className="text-[#534342] font-medium text-xs">{row.description}</span>
        </div>
      </div>

      {/* Action */}
      {row.type === 'toggle' ? (
        <button
          onClick={onToggle}
          className={`w-12 h-6 rounded-full flex items-center transition-colors ${
            toggled ? 'bg-[#db2777] justify-end pr-1' : 'bg-gray-300 justify-start pl-1'
          }`}
          aria-label={`Toggle ${row.title}`}
        >
          <span className="w-4 h-4 bg-white rounded-full shadow" />
        </button>
      ) : (
        <></>
      )}
    </div>
  )
}

interface PreferencesRowProps {
  lookingFor: LookingFor | null
  minAgePref: number
  maxAgePref: number
  minFtpPref: number
  maxFtpPref: number
  requireFtp: boolean
  open: boolean
  saving: boolean
  onToggleOpen: () => void
  onSelect: (next: LookingFor) => void
  onAgePrefsChange: (min: number, max: number) => Promise<void> | void
  onFtpPrefsChange: (min: number, max: number, requireFtp: boolean) => Promise<void> | void
}

function PreferencesRow({
  lookingFor,
  minAgePref,
  maxAgePref,
  minFtpPref,
  maxFtpPref,
  requireFtp,
  open,
  saving,
  onToggleOpen,
  onSelect,
  onAgePrefsChange,
  onFtpPrefsChange,
}: PreferencesRowProps) {
  // Local draft age range — updated live while dragging; committed on release
  const [localMin, setLocalMin] = useState(minAgePref)
  const [localMax, setLocalMax] = useState(maxAgePref)
  const [savingAge, setSavingAge] = useState(false)

  // Local draft FTP range + require flag — same pattern as age range
  const [localFtpMin, setLocalFtpMin] = useState(minFtpPref)
  const [localFtpMax, setLocalFtpMax] = useState(maxFtpPref)
  const [localRequireFtp, setLocalRequireFtp] = useState(requireFtp)
  const [savingFtp, setSavingFtp] = useState(false)

  // Keep local state in sync when props change (e.g. after save round-trip)
  const prevMin = useRef(minAgePref)
  const prevMax = useRef(maxAgePref)
  if (prevMin.current !== minAgePref) { prevMin.current = minAgePref; setLocalMin(minAgePref) }
  if (prevMax.current !== maxAgePref) { prevMax.current = maxAgePref; setLocalMax(maxAgePref) }

  const prevFtpMin = useRef(minFtpPref)
  const prevFtpMax = useRef(maxFtpPref)
  const prevRequireFtp = useRef(requireFtp)
  if (prevFtpMin.current !== minFtpPref) { prevFtpMin.current = minFtpPref; setLocalFtpMin(minFtpPref) }
  if (prevFtpMax.current !== maxFtpPref) { prevFtpMax.current = maxFtpPref; setLocalFtpMax(maxFtpPref) }
  if (prevRequireFtp.current !== requireFtp) { prevRequireFtp.current = requireFtp; setLocalRequireFtp(requireFtp) }

  async function handleAgeCommit(min: number, max: number) {
    setLocalMin(min)
    setLocalMax(max)
    setSavingAge(true)
    try {
      await onAgePrefsChange(min, max)
    } finally {
      setSavingAge(false)
    }
  }

  async function handleFtpCommit(min: number, max: number, require: boolean) {
    setLocalFtpMin(min)
    setLocalFtpMax(max)
    setLocalRequireFtp(require)
    setSavingFtp(true)
    try {
      await onFtpPrefsChange(min, max, require)
    } finally {
      setSavingFtp(false)
    }
  }

  function handleToggleRequireFtp() {
    const next = !localRequireFtp
    setLocalRequireFtp(next)
    handleFtpCommit(localFtpMin, localFtpMax, next)
  }

  const description = lookingFor
    ? `Showing ${LOOKING_FOR_LABEL[lookingFor].toLowerCase()}, ${localMin}–${localMax === 99 ? '99+' : localMax}`
    : 'Pick who shows up in discovery'

  return (
    <div className="flex flex-col">
      <button
        onClick={onToggleOpen}
        className="flex items-center justify-between p-4 rounded-2xl hover:bg-[#fef2f2]/30 transition-colors w-full text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-4">
          <div className="bg-[#fee2e2] w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
            <PiHeart size={26} className="text-[#db2777]" />
          </div>
          <div className="flex flex-col gap-px">
            <span className="text-[#1d1a20] font-semibold text-[14px]">Dating Preferences</span>
            <span className="text-[#534342] font-medium text-xs">{description}</span>
          </div>
        </div>
        {open ? (
          <PiCaretDown size={18} className="text-[#94a3b8]" />
        ) : (
          <PiCaretRight size={18} className="text-[#94a3b8]" />
        )}
      </button>

      {open && (
        <div className="ml-16 mt-2 mr-4 mb-1 flex flex-col gap-5">
          {/* Show me */}
          <div className="flex flex-col gap-3">
            <span className="text-[#534342] font-semibold text-xs uppercase tracking-[1.2px]">
              Show me
            </span>
            <div className="flex flex-wrap gap-2">
              {LOOKING_FOR_OPTIONS.map((opt) => {
                const selected = lookingFor === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => onSelect(opt.value)}
                    disabled={saving}
                    className={`px-4 py-2 rounded-full border font-semibold text-sm transition-colors disabled:opacity-60 ${
                      selected
                        ? 'border-[#db2777] bg-[#fef2f2] text-[#db2777]'
                        : 'border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#fef2f2]/50 hover:text-[#db2777]'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            {saving && (
              <span className="text-[#94a3b8] text-xs italic">Saving…</span>
            )}
          </div>

          {/* Age range */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[#534342] font-semibold text-xs uppercase tracking-[1.2px]">
                Age range
              </span>
              <span className="text-[#DB2777] font-semibold text-sm tabular-nums">
                {localMin}–{localMax === 99 ? '99+' : localMax}
              </span>
            </div>
            <AgeRangeSlider
              minAge={localMin}
              maxAge={localMax}
              onChange={(min, max) => { setLocalMin(min); setLocalMax(max) }}
              onCommit={handleAgeCommit}
            />
            {savingAge && (
              <span className="text-[#94a3b8] text-xs italic">Saving…</span>
            )}
          </div>

          {/* FTP range — Strava cycling functional threshold power filter */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[#534342] font-semibold text-xs uppercase tracking-[1.2px]">
                FTP range
              </span>
              <span className="text-[#DB2777] font-semibold text-sm tabular-nums">
                {localFtpMin}–{localFtpMax === FTP_MAX ? `${FTP_MAX}+` : localFtpMax}W
              </span>
            </div>
            <FtpRangeSlider
              minFtp={localFtpMin}
              maxFtp={localFtpMax}
              onChange={(min, max) => { setLocalFtpMin(min); setLocalFtpMax(max) }}
              onCommit={(min, max) => handleFtpCommit(min, max, localRequireFtp)}
            />
            {/* Require-FTP toggle — sits under the slider */}
            <button
              type="button"
              onClick={handleToggleRequireFtp}
              className="flex items-center justify-between rounded-xl hover:bg-[#fef2f2]/30 transition-colors"
              aria-pressed={localRequireFtp}
            >
              <span className="text-[#534342] font-medium text-xs text-left">
                Only show users with FTP
              </span>
              <span
                className={`w-10 h-5 rounded-full flex items-center transition-colors shrink-0 ${
                  localRequireFtp ? 'bg-[#db2777] justify-end pr-0.5' : 'bg-gray-300 justify-start pl-0.5'
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow" />
              </span>
            </button>
            {savingFtp && (
              <span className="text-[#94a3b8] text-xs italic">Saving…</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Dual-thumb age range slider ────────────────────────────────────────────────

const AGE_MIN = 18
const AGE_MAX = 99
// FTP slider bounds (watts). Must stay in sync with the user_details
// `user_details_ftp_pref_check` constraint server-side.
const FTP_MIN = 50
const FTP_MAX = 500
// Snap FTP slider movements to 5W increments — finer than that doesn't
// match how athletes self-report and makes the thumb feel jittery.
const FTP_STEP = 5

interface AgeRangeSliderProps {
  minAge: number
  maxAge: number
  /** Called on every drag move so labels update live. */
  onChange: (min: number, max: number) => void
  /** Called once on pointer release — this is when you should persist. */
  onCommit: (min: number, max: number) => void
}

function AgeRangeSlider({ minAge, maxAge, onChange, onCommit }: AgeRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const toPct = (v: number) => ((v - AGE_MIN) / (AGE_MAX - AGE_MIN)) * 100
  const minPct = toPct(minAge)
  const maxPct = toPct(maxAge)

  function valueFromX(clientX: number): number {
    const el = trackRef.current
    if (!el) return AGE_MIN
    const { left, width } = el.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (clientX - left) / width))
    return Math.round(AGE_MIN + pct * (AGE_MAX - AGE_MIN))
  }

  function thumbHandlers(thumb: 'min' | 'max') {
    return {
      onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
        e.currentTarget.setPointerCapture(e.pointerId)
      },
      onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
        const val = valueFromX(e.clientX)
        if (thumb === 'min') onChange(Math.min(val, maxAge - 1), maxAge)
        else onChange(minAge, Math.max(val, minAge + 1))
      },
      onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
        const val = valueFromX(e.clientX)
        if (thumb === 'min') onCommit(Math.min(val, maxAge - 1), maxAge)
        else onCommit(minAge, Math.max(val, minAge + 1))
      },
    }
  }

  return (
    <div className="py-2">
      {/* Track */}
      <div ref={trackRef} className="relative h-1.5 bg-[#e2e8f0] rounded-full mx-2.5">
        {/* Active fill */}
        <div
          className="absolute h-full bg-[#db2777] rounded-full pointer-events-none"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        {/* Min thumb */}
        <div
          {...thumbHandlers('min')}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-[#db2777] rounded-full shadow cursor-grab active:cursor-grabbing touch-none select-none z-10"
          style={{ left: `${minPct}%` }}
          role="slider"
          aria-label="Minimum age"
          aria-valuenow={minAge}
          aria-valuemin={AGE_MIN}
          aria-valuemax={maxAge - 1}
        />
        {/* Max thumb */}
        <div
          {...thumbHandlers('max')}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-[#db2777] rounded-full shadow cursor-grab active:cursor-grabbing touch-none select-none z-10"
          style={{ left: `${maxPct}%` }}
          role="slider"
          aria-label="Maximum age"
          aria-valuenow={maxAge}
          aria-valuemin={minAge + 1}
          aria-valuemax={AGE_MAX}
        />
      </div>
      {/* Tick labels */}
      <div className="flex justify-between mt-2 px-2.5 text-[10px] text-[#94a3b8] font-medium select-none">
        <span>{AGE_MIN}</span>
        <span>99+</span>
      </div>
    </div>
  )
}

interface FtpRangeSliderProps {
  minFtp: number
  maxFtp: number
  /** Called on every drag move so labels update live. */
  onChange: (min: number, max: number) => void
  /** Called once on pointer release — this is when you should persist. */
  onCommit: (min: number, max: number) => void
}

function FtpRangeSlider({ minFtp, maxFtp, onChange, onCommit }: FtpRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const toPct = (v: number) => ((v - FTP_MIN) / (FTP_MAX - FTP_MIN)) * 100
  const minPct = toPct(minFtp)
  const maxPct = toPct(maxFtp)

  function valueFromX(clientX: number): number {
    const el = trackRef.current
    if (!el) return FTP_MIN
    const { left, width } = el.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (clientX - left) / width))
    const raw = FTP_MIN + pct * (FTP_MAX - FTP_MIN)
    return Math.round(raw / FTP_STEP) * FTP_STEP
  }

  function thumbHandlers(thumb: 'min' | 'max') {
    return {
      onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
        e.currentTarget.setPointerCapture(e.pointerId)
      },
      onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
        const val = valueFromX(e.clientX)
        if (thumb === 'min') onChange(Math.min(val, maxFtp - FTP_STEP), maxFtp)
        else onChange(minFtp, Math.max(val, minFtp + FTP_STEP))
      },
      onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
        const val = valueFromX(e.clientX)
        if (thumb === 'min') onCommit(Math.min(val, maxFtp - FTP_STEP), maxFtp)
        else onCommit(minFtp, Math.max(val, minFtp + FTP_STEP))
      },
    }
  }

  return (
    <div className="py-2">
      <div ref={trackRef} className="relative h-1.5 bg-[#e2e8f0] rounded-full mx-2.5">
        <div
          className="absolute h-full bg-[#db2777] rounded-full pointer-events-none"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        <div
          {...thumbHandlers('min')}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-[#db2777] rounded-full shadow cursor-grab active:cursor-grabbing touch-none select-none z-10"
          style={{ left: `${minPct}%` }}
          role="slider"
          aria-label="Minimum FTP (watts)"
          aria-valuenow={minFtp}
          aria-valuemin={FTP_MIN}
          aria-valuemax={maxFtp - FTP_STEP}
        />
        <div
          {...thumbHandlers('max')}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-[#db2777] rounded-full shadow cursor-grab active:cursor-grabbing touch-none select-none z-10"
          style={{ left: `${maxPct}%` }}
          role="slider"
          aria-label="Maximum FTP (watts)"
          aria-valuenow={maxFtp}
          aria-valuemin={minFtp + FTP_STEP}
          aria-valuemax={FTP_MAX}
        />
      </div>
      <div className="flex justify-between mt-2 px-2.5 text-[10px] text-[#94a3b8] font-medium select-none">
        <span>{FTP_MIN}W</span>
        <span>{FTP_MAX}W+</span>
      </div>
    </div>
  )
}

/**
 * Skeleton for the settings rows + integrations section only — the card
 * heading is always rendered live so the section identity stays stable
 * while loading.
 */
function AccountSettingsBodyLoading() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div className="flex flex-col gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#fee2e2]/70" />
              <div className="flex flex-col gap-2">
                <div className="h-4 w-40 bg-[#e2e8f0] rounded" />
                <div className="h-3 w-56 bg-[#f1f5f9] rounded" />
              </div>
            </div>
            <div className="w-12 h-6 bg-[#f1f5f9] rounded-full" />
          </div>
        ))}
      </div>
      <div className="border-t border-[#f1f5f9]" />
      <div className="flex flex-col gap-3">
        <div className="h-3 w-24 bg-[#f1f5f9] rounded mx-4" />
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#f1f5f9]" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-20 bg-[#e2e8f0] rounded" />
              <div className="h-3 w-44 bg-[#f1f5f9] rounded" />
            </div>
          </div>
          <div className="h-9 w-24 bg-[#f1f5f9] rounded-full" />
        </div>
      </div>
    </div>
  )
}
