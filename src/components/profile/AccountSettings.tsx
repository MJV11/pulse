import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  PROFILE_ICON_BELL,
  PROFILE_ICON_CARD,
  PROFILE_ICON_CHEVRON,
  PROFILE_ICON_LOCK,
  PROFILE_ICON_SETTINGS,
  PROFILE_NAV_SIGNOUT,
} from '../../lib/assets'

interface SettingRow {
  id: string
  icon: string
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
      icon: PROFILE_ICON_BELL,
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
      icon: PROFILE_ICON_LOCK,
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
      icon: PROFILE_ICON_CARD,
      iconBg: 'bg-[#fee2e2]',
      title: 'Subscription',
      description: 'Pulse Gold • Active until Oct 2024',
      type: 'chevron',
    },
  ],
])

export function AccountSettings() {
  const { signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const [toggleState, setToggleState] = useState(
    new Map<string, boolean>([['notifications', true]])
  )

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

  return (
    <div className="bg-white border border-[rgba(254,242,242,0.5)] rounded-2xl shadow-[0px_8px_30px_0px_rgba(0,0,0,0.04)] p-[33px] flex flex-col gap-8 col-span-3">
      {/* Heading */}
      <div className="flex items-center gap-2">
        <img src={PROFILE_ICON_SETTINGS} alt="" className="w-[17px] h-[17px] object-contain" />
        <h2 className="text-[#1d1a20] font-bold text-xl">Account Settings</h2>
      </div>

      {/* Settings rows */}
      <div className="flex flex-col gap-6">
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

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[#fef2f2]/40 transition-colors w-full text-left disabled:opacity-60"
      >
        <div className="bg-[#fef2f2] w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
          <img src={PROFILE_NAV_SIGNOUT} alt="" className="w-5 h-5 object-contain" />
        </div>
        <div className="flex flex-col gap-px">
          <span className="text-[#dc2626] font-semibold text-[14px]">
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </span>
          <span className="text-[#94a3b8] font-medium text-xs">Log out of your account</span>
        </div>
      </button>
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
        <div className={`${row.iconBg} w-12 h-12 rounded-2xl flex items-center justify-center shrink-0`}>
          <img src={row.icon} alt="" className="w-4 h-5 object-contain" />
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
        <button className="hover:opacity-70 transition-opacity" aria-label={`Open ${row.title}`}>
          <img src={PROFILE_ICON_CHEVRON} alt="" className="w-[7px] h-3 object-contain" />
        </button>
      )}
    </div>
  )
}
