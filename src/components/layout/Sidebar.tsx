import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { currentUser } from '../../lib/data'
import {
  PiCompass,
  PiHeart,
  PiChats,
  PiUser,
  PiGear,
  PiSignOut,
} from 'react-icons/pi'
import type { IconType } from 'react-icons'

export type SidebarVariant = 'discovery' | 'messages' | 'profile'

interface NavItem {
  label: string
  to: string
  Icon: IconType
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Discovery', to: '/discovery', Icon: PiCompass },
  { label: 'Matches',   to: '/matches',   Icon: PiHeart },
  { label: 'Messages',  to: '/messages',  Icon: PiChats },
  { label: 'Profile',   to: '/profile',   Icon: PiUser },
]

interface SidebarProps {
  variant: SidebarVariant
}

export function Sidebar({ variant }: SidebarProps) {
  return (
    <aside className="fixed top-0 left-0 h-full w-[288px] bg-white border-r border-[#f1f5f9] flex flex-col py-8 z-30 shadow-[0px_25px_50px_-12px_rgba(127,29,29,0.05)]">
      {/* Logo */}
      <div className="px-6 pb-10">
        <span className="text-[#dc2626] font-extrabold text-3xl leading-9">
          Pulse
        </span>
      </div>

      {/* Nav links — identical on every page */}
      <nav className="flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, to, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-4 px-6 py-3 text-base font-semibold transition-colors ${
                isActive
                  ? 'bg-[#fef2f2] text-[#dc2626] border-r-4 border-[#dc2626]'
                  : 'text-[#64748b] hover:bg-[#fef2f2]/50 hover:text-[#1d1a20]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} className={isActive ? 'text-[#dc2626]' : 'text-[#94a3b8]'} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section — varies by page context */}
      <div className="px-6 pt-6">
        {variant === 'discovery' && <PremiumCard />}
        {variant === 'messages' && <UserProfileCard />}
        {variant === 'profile' && <ProfileBottomNav />}
      </div>
    </aside>
  )
}

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

function ProfileBottomNav() {
  const { signOut } = useAuth()

  return (
    <div className="border-t border-[#f1f5f9] pt-4 flex flex-col gap-1">
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `flex items-center gap-4 px-2 py-3 text-base font-semibold transition-colors rounded-xl ${
            isActive ? 'text-[#dc2626]' : 'text-[#64748b] hover:bg-[#fef2f2]/50 hover:text-[#1d1a20]'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <PiGear size={20} className={isActive ? 'text-[#dc2626]' : 'text-[#94a3b8]'} />
            <span>Settings</span>
          </>
        )}
      </NavLink>
      <button
        onClick={() => signOut()}
        className="flex items-center gap-4 px-2 py-3 text-base font-semibold text-[#ba1a1a] hover:bg-[#fef2f2]/50 rounded-xl w-full transition-colors"
      >
        <PiSignOut size={20} className="text-[#ba1a1a]" />
        <span>Sign Out</span>
      </button>
    </div>
  )
}
