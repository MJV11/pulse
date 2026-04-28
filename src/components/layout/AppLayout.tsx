import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

/**
 * Shared chrome for the authenticated app: fixed sidebar on the left,
 * page content on the right via `<Outlet />`. Pages render only their own
 * content — they never need to know the sidebar exists.
 *
 * The sidebar is `position: fixed` and 288px wide, so the content shell
 * just offsets itself with `ml-[288px]`. Pages that want full-viewport
 * height (e.g. Messages) can apply `h-screen overflow-hidden` on their
 * own root; pages that want scroll just let content grow naturally.
 */
export function AppLayout() {
  return (
    <div className="bg-[#fbf8ff] min-h-screen">
      <Sidebar />
      <div className="ml-[288px]">
        <Outlet />
      </div>
    </div>
  )
}
