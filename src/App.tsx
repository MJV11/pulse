import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProfileProvider } from './context/ProfileContext'
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { SignUpPage } from './pages/SignUpPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { UpdatePasswordPage } from './pages/UpdatePasswordPage'
import { DiscoveryPage } from './pages/DiscoveryPage'
import { MatchesPage } from './pages/MatchesPage'
import { MessagesPage } from './pages/MessagesPage'
import { ProfilePage } from './pages/ProfilePage'
import { StravaCallbackPage } from './pages/StravaCallbackPage'
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
            {/* Protected app routes — share the AppLayout chrome */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/discovery" element={<DiscoveryPage />} />
              <Route path="/matches" element={<MatchesPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Strava OAuth callback — protected, but no sidebar chrome */}
            <Route
              path="/integrations/strava/callback"
              element={
                <ProtectedRoute>
                  <StravaCallbackPage />
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
