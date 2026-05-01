import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

/**
 * Shared chrome for the authenticated app.
 *
 * Desktop (≥ md / 768px): fixed 288px left sidebar, content offset with `md:ml-[288px]`.
 * Mobile (< md): sidebar is hidden, a fixed bottom tab bar provides navigation.
 * Content gets `pb-14` on mobile so it never scrolls under the bottom nav.
 *
 * Pages that want full-viewport height (e.g. Messages) should use
 * `h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden` on their own root to
 * stay bounded on both mobile and desktop.
 */
export function AppLayout() {
  return (
    <div className="bg-[#fbf8ff] min-h-screen">
      <Sidebar />
      <div className="md:ml-[288px] pb-14 md:pb-0">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
