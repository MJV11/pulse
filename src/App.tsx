import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProfileProvider } from './context/ProfileContext'
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { SignUpPage } from './pages/SignUpPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { UpdatePasswordPage } from './pages/UpdatePasswordPage'
import { DiscoveryPage } from './pages/DiscoveryPage'
import { MatchesPage } from './pages/MatchesPage'
import { MessagesPage } from './pages/MessagesPage'
import { ProfilePage } from './pages/ProfilePage'
import { useLocationSync } from './hooks/useLocationSync'

/** Mounts inside AuthProvider so it can access the session. Renders nothing. */
function LocationSync() {
  useLocationSync()
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
          <LocationSync />
          <Routes>
            {/* Protected app routes */}
            <Route
              path="/discovery"
              element={
                <ProtectedRoute>
                  <DiscoveryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matches"
              element={
                <ProtectedRoute>
                  <MatchesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/discovery" replace />} />

            {/* Update password — reachable while session is being established via magic link */}
            <Route path="/update-password" element={<UpdatePasswordPage />} />

            {/* Public only */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <SignUpPage />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <ResetPasswordPage />
                </PublicRoute>
              }
            />

            <Route path="*" element={<Navigate to="/discovery" replace />} />
          </Routes>
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
