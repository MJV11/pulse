import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { StravaIntegrationRow } from './StravaIntegrationRow'
import { PiBell, PiCaretRightBold, PiGear, PiLock, PiLockSimpleBold, PiSignOutBold } from 'react-icons/pi'

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
    <div className="bg-white border border-[rgba(254,242,242,0.5)] rounded-2xl shadow-[0px_8px_30px_0px_rgba(0,0,0,0.04)] p-[33px] flex flex-col gap-8 col-span-4">
      {/* Heading */}
      <div className="flex items-center gap-2">
        <PiGear size={24} className="text-[#dc2626]" />
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
