import { NavLink } from 'react-router-dom'
import {
  PiCompass,
  PiHeart,
  PiChats,
  PiUser,
} from 'react-icons/pi'
import type { IconType } from 'react-icons'

interface NavItem {
  label: string
  to: string
  Icon: IconType
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Discover',  to: '/discovery', Icon: PiCompass },
  { label: 'Matches',   to: '/matches',   Icon: PiHeart },
  { label: 'Messages',  to: '/messages',  Icon: PiChats },
  { label: 'Profile',   to: '/profile',   Icon: PiUser },
]

/**
 * Mobile-only bottom tab navigation bar. Shown on screens narrower than md (768px),
 * hidden on desktop where the left sidebar handles navigation.
 */
export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-[#f1f5f9] flex items-stretch z-30 shadow-[0_-4px_20px_0px_rgba(127,29,29,0.05)]">
      {NAV_ITEMS.map(({ label, to, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              isActive ? 'text-[#dc2626]' : 'text-[#94a3b8]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={22} className={isActive ? 'text-[#dc2626]' : 'text-[#94a3b8]'} />
              <span className="text-[10px] font-semibold">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
