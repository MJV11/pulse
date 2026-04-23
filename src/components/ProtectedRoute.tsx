import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from 'flowbite-react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Spinner size="xl" />
      </div>
    )
  }

  return session ? <>{children}</> : <Navigate to="/login" replace />
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Spinner size="xl" />
      </div>
    )
  }

  return session ? <Navigate to="/" replace /> : <>{children}</>
}
