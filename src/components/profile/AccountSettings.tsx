import { useState } from 'react'
import {
  PROFILE_ICON_BELL,
  PROFILE_ICON_CARD,
  PROFILE_ICON_CHEVRON,
  PROFILE_ICON_LOCK,
  PROFILE_ICON_SETTINGS,
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

/**
 * Account Settings bento card with toggle and chevron setting rows.
 */
export function AccountSettings() {
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
          <SettingRow
            key={row.id}
            row={row}
            toggled={toggleState.get(row.id) ?? false}
            onToggle={() => handleToggle(row.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface SettingRowProps {
  row: SettingRow
  toggled: boolean
  onToggle: () => void
}

function SettingRow({ row, toggled, onToggle }: SettingRowProps) {
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
