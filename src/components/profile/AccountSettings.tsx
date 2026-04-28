import { useState } from 'react'
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
      icon: <PiBell size={26} className="text-[#dc2626]" />,
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
      icon: <PiCaretRightBold size={26} className="text-[#dc2626]" />,
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
  /** When true, renders skeleton placeholders in place of the real content. */
  isLoading?: boolean
  /**
   * Persist a new looking-for value. Resolves once the change is saved so the
   * row can show a brief saving state. The parent owns the API call so this
   * row stays a dumb settings list.
   */
  onLookingForChange: (next: LookingFor) => Promise<void> | void
}

export function AccountSettings({
  lookingFor,
  isLoading = false,
  onLookingForChange,
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
        <PiGear size={24} className="text-[#dc2626]" />
        <h2 className="text-[#1d1a20] font-bold text-xl">Account Settings</h2>
      </div>

      {isLoading ? (
        <AccountSettingsBodyLoading />
      ) : (
        <>
          {/* Settings rows */}
          <div className="flex flex-col gap-6">
            {/* Dating Preferences — expandable submenu for the looking-for selector */}
            <PreferencesRow
              lookingFor={lookingFor}
              open={preferencesOpen}
              saving={savingPref}
              onToggleOpen={() => setPreferencesOpen((o) => !o)}
              onSelect={handleSelectLookingFor}
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
              <PiSignOutBold size={20} className="text-[#dc2626]" />
            </div>
            <div className="flex flex-col gap-px">
              <span className="text-[#dc2626] font-semibold text-[14px]">
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
        <div className={`${row.iconBg} text-[#dc2626] w-12 h-12 rounded-2xl flex items-center justify-center shrink-0`}>
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
            toggled ? 'bg-[#dc2626] justify-end pr-1' : 'bg-gray-300 justify-start pl-1'
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
  open: boolean
  saving: boolean
  onToggleOpen: () => void
  onSelect: (next: LookingFor) => void
}

function PreferencesRow({
  lookingFor,
  open,
  saving,
  onToggleOpen,
  onSelect,
}: PreferencesRowProps) {
  const description = lookingFor
    ? `Showing ${LOOKING_FOR_LABEL[lookingFor].toLowerCase()}`
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
            <PiHeart size={26} className="text-[#dc2626]" />
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
        <div className="ml-16 mt-2 mr-4 mb-1 flex flex-col gap-3">
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
                      ? 'border-[#dc2626] bg-[#fef2f2] text-[#dc2626]'
                      : 'border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#fef2f2]/50 hover:text-[#dc2626]'
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
      )}
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
