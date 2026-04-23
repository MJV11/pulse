import { NavLink } from 'react-router-dom'
import { currentUser } from '../../lib/data'
import {
  DISCOVERY_NAV_DISCOVERY,
  DISCOVERY_NAV_MATCHES,
  DISCOVERY_NAV_MESSAGES,
  DISCOVERY_NAV_SETTINGS,
  MSG_NAV_DISCOVERY,
  MSG_NAV_MESSAGES,
  MSG_NAV_MATCHES,
  MSG_NAV_SETTINGS,
  PROFILE_NAV_PROFILE,
  PROFILE_NAV_DISCOVERY,
  PROFILE_NAV_MATCHES,
  PROFILE_NAV_MESSAGES,
  PROFILE_NAV_SETTINGS,
  PROFILE_NAV_SIGNOUT,
} from '../../lib/assets'

export type SidebarVariant = 'discovery' | 'messages' | 'profile'

interface NavItem {
  label: string
  to: string
  icon: string
}

const NAV_ITEMS: Record<SidebarVariant, NavItem[]> = {
  discovery: [
    { label: 'Discovery', to: '/discovery', icon: DISCOVERY_NAV_DISCOVERY },
    { label: 'Matches', to: '/matches', icon: DISCOVERY_NAV_MATCHES },
    { label: 'Messages', to: '/messages', icon: DISCOVERY_NAV_MESSAGES },
    { label: 'Settings', to: '/settings', icon: DISCOVERY_NAV_SETTINGS },
  ],
  messages: [
    { label: 'Discovery', to: '/discovery', icon: MSG_NAV_DISCOVERY },
    { label: 'Messages', to: '/messages', icon: MSG_NAV_MESSAGES },
    { label: 'Matches', to: '/matches', icon: MSG_NAV_MATCHES },
    { label: 'Settings', to: '/settings', icon: MSG_NAV_SETTINGS },
  ],
  profile: [
    { label: 'Profile', to: '/profile', icon: PROFILE_NAV_PROFILE },
    { label: 'Discovery', to: '/discovery', icon: PROFILE_NAV_DISCOVERY },
    { label: 'Matches', to: '/matches', icon: PROFILE_NAV_MATCHES },
    { label: 'Messages', to: '/messages', icon: PROFILE_NAV_MESSAGES },
  ],
}

interface SidebarProps {
  variant: SidebarVariant
}

/**
 * Shared left navigation sidebar — adapts active item and bottom section
 * based on the current page variant.
 */
export function Sidebar({ variant }: SidebarProps) {
  const navItems = NAV_ITEMS[variant]

  return (
    <aside className="fixed top-0 left-0 h-full w-[288px] bg-white border-r border-[#f1f5f9] flex flex-col justify-between py-8 z-30 shadow-[0px_25px_50px_-12px_rgba(127,29,29,0.05)]">
      {/* Logo */}
      <div className="px-6 pb-10">
        <span
          className={`text-[#dc2626] font-extrabold text-3xl leading-9 ${variant === 'messages' ? 'italic' : ''}`}
        >
          Pulse
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-4 px-6 py-3 text-base font-semibold transition-colors ${
                isActive
                  ? 'bg-[#fef2f2] text-[#dc2626] border-r-4 border-[#dc2626]'
                  : 'text-[#64748b] hover:bg-[#fef2f2]/50'
              }`
            }
          >
            <img src={item.icon} alt="" className="w-[18px] h-[18px] object-contain shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom section — varies by variant */}
      <div className="px-6 pt-6">
        {variant === 'discovery' && <PremiumCard />}
        {variant === 'messages' && <UserProfileCard />}
        {variant === 'profile' && <ProfileBottomNav />}
      </div>
    </aside>
  )
}

/** Pulse Premium upgrade card (Discovery sidebar) */
function PremiumCard() {
  return (
    <div className="bg-[#fef2f2] border border-[#fee2e2] rounded-2xl p-[17px] flex flex-col gap-1">
      <p className="text-[#dc2626] font-semibold text-base">Pulse Premium</p>
      <p className="text-[rgba(153,27,27,0.7)] font-medium text-xs pb-3">
        Feel the beat. See who liked you.
      </p>
      <button
        className="w-full py-[10px] rounded-lg text-sm font-semibold text-white text-center"
        style={{ background: 'linear-gradient(134.84deg, #d90429 0%, #ff4d6d 100%)' }}
      >
        Upgrade Now
      </button>
    </div>
  )
}

/** Logged-in user card (Messages sidebar) */
function UserProfileCard() {
  return (
    <div className="bg-[#fef2f2] border border-[rgba(254,226,226,0.2)] rounded-2xl p-[13px] flex items-center gap-3">
      <img
        src={currentUser.avatar}
        alt={currentUser.name}
        className="w-10 h-10 rounded-full object-cover shrink-0"
      />
      <div className="min-w-0">
        <p className="font-bold text-[14px] text-[#131b2e] truncate">{currentUser.name}</p>
        <p className="font-medium text-[12px] text-[#dc2626] truncate">{currentUser.plan}</p>
      </div>
    </div>
  )
}

/** Settings + Sign Out links (Profile sidebar) */
function ProfileBottomNav() {
  return (
    <div className="border-t border-[#f1f5f9] pt-4 flex flex-col gap-1">
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `flex items-center gap-4 px-2 py-3 text-base font-semibold transition-colors ${
            isActive ? 'text-[#dc2626]' : 'text-[#64748b] hover:bg-[#fef2f2]/50'
          }`
        }
      >
        <img src={PROFILE_NAV_SETTINGS} alt="" className="w-[18px] h-[18px] object-contain" />
        <span>Settings</span>
      </NavLink>
      <button className="flex items-center gap-4 px-2 py-3 text-base font-semibold text-[#ba1a1a] hover:bg-[#fef2f2]/50 w-full">
        <img src={PROFILE_NAV_SIGNOUT} alt="" className="w-[18px] h-[18px] object-contain" />
        <span>Sign Out</span>
      </button>
    </div>
  )
}
