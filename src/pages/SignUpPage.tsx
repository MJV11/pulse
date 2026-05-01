import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, Label, TextInput } from '../components/flowbite-proxy'
import { supabase } from '../lib/supabase'

export function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    if (error) {
      setError(error.message)
    } else {
      setConfirmed(true)
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
          <p className="mt-2 text-sm text-gray-500">Create your account</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {error && <Alert color="failure" className="mb-4">{error}</Alert>}

          {confirmed ? (
            <Alert color="success">
              <p className="font-medium">Check your email!</p>
              <p className="mt-1 text-sm">
                We sent a confirmation link to <span className="font-medium">{email}</span>. Click
                it to activate your account.
              </p>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="email" value="Email address" color="pulse" />
                <TextInput
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  color="pulse"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password" value="Password" color="pulse" />
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
                <Label htmlFor="confirm" value="Confirm password" color="pulse" />
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
                Create account
              </Button>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-[#D90429] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
