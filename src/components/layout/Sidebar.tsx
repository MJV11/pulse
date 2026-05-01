import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  PiCompass,
  PiHeart,
  PiChats,
  PiUser,
  PiSignOut,
} from 'react-icons/pi'
import type { IconType } from 'react-icons'

/**
 * `variant` is kept as an optional prop for backwards compatibility with
 * existing pages, but the sidebar now renders an identical bottom section
 * (Pulse Premium upsell + Settings + Sign Out) on every page.
 */
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
  variant?: SidebarVariant
}

export function Sidebar({ variant: _variant }: SidebarProps = {}) {
  return (
    <aside className="hidden md:flex fixed top-0 left-0 h-full w-[288px] bg-white border-r border-[#f1f5f9] flex-col py-8 z-30 shadow-[0px_25px_50px_-12px_rgba(127,29,29,0.05)]">
      {/* Logo */}
      <div className="px-6 pb-10">
        <div className="flex items-center gap-2.5">
          <PulseIcon />
          <span className="text-[#dc2626] font-extrabold text-3xl leading-9">
            Pulse
          </span>
        </div>
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

      {/* Bottom section — identical on every page */}
      <div className="px-6 pt-6 flex flex-col gap-4">
        <PremiumCard />
        <ProfileBottomNav />
      </div>
    </aside>
  )
}

/**
 * Heart logo with a white ECG/heartbeat trace clipped inside.
 * The trace is a simplified PQRST waveform — small P bump, sharp R spike,
 * deeper S dip, rounded T wave — giving the "pulse" metaphor at a glance.
 */
function PulseIcon() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 36 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="pulse-icon-grad"
          x1="0" y1="0" x2="36" y2="34"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#d90429" />
          <stop offset="100%" stopColor="#ff4d6d" />
        </linearGradient>
        <clipPath id="pulse-icon-clip">
          <path d="M18 32 C9 26 1 19 1 12 C1 6 6 2 11 2 C14 2 17 4 18 7 C19 4 22 2 25 2 C30 2 35 6 35 12 C35 19 27 26 18 32Z" />
        </clipPath>
      </defs>

      {/* Heart body */}
      <path
        d="M18 32 C9 26 1 19 1 12 C1 6 6 2 11 2 C14 2 17 4 18 7 C19 4 22 2 25 2 C30 2 35 6 35 12 C35 19 27 26 18 32Z"
        fill="url(#pulse-icon-grad)"
      />

      {/* ECG trace — flat → spike up → spike down → flat */}
      <g clipPath="url(#pulse-icon-clip)">
        <path
          d="M1,18 L15,18 L17,10 L20,24 L22,18 L35,18"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeOpacity="0.95"
        />
      </g>
    </svg>
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

function ProfileBottomNav() {
  const { signOut } = useAuth()

  return (
    <div className="border-t border-[#f1f5f9] pt-4 flex flex-col gap-1">
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
