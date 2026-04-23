import { Avatar, Button, Dropdown, Navbar } from 'flowbite-react'
import { useAuth } from '../context/AuthContext'

export function DashboardPage() {
  const { user, signOut } = useAuth()

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '??'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar fluid className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <Navbar.Brand>
          <span className="self-center whitespace-nowrap text-xl font-semibold text-gray-900 dark:text-white">
            Pulse
          </span>
        </Navbar.Brand>

        <div className="flex items-center gap-3">
          <Dropdown
            label={
              <Avatar
                placeholderInitials={initials}
                rounded
                className="cursor-pointer"
              />
            }
            arrowIcon={false}
            inline
          >
            <Dropdown.Header>
              <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">
                {user?.email}
              </span>
            </Dropdown.Header>
            <Dropdown.Item onClick={signOut}>Sign out</Dropdown.Item>
          </Dropdown>
        </div>
      </Navbar>

      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You're signed in as <span className="font-medium">{user?.email}</span>
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {['Overview', 'Settings', 'Activity'].map((title) => (
            <div
              key={title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Your {title.toLowerCase()} will appear here.
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Button color="light" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </main>
    </div>
  )
}
