import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Label, TextInput } from '../components/flowbite-proxy'
import { supabase } from '../lib/supabase'

export function UpdatePasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/'), 2000)
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fbf8ff] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1
            className="text-3xl font-bold"
            style={{ background: 'linear-gradient(135deg, #D90429 0%, #FF4D6D 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            Pulse
          </h1>
          <p className="mt-2 text-sm text-gray-500">Choose a new password</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {error && <Alert color="failure" className="mb-4">{error}</Alert>}

          {success ? (
            <Alert color="success">
              <p className="font-medium">Password updated!</p>
              <p className="mt-1 text-sm">Redirecting you to the dashboard…</p>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="password" value="New password" color="pulse" />
                <TextInput
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  color="pulse"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="confirm" value="Confirm new password" color="pulse" />
                <TextInput
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  color="pulse"
                  className="mt-1"
                />
              </div>

              <Button
                type="submit"
                color="pulse-primary"
                isProcessing={loading}
                disabled={loading}
                className="mt-2 w-full"
              >
                Update password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
