import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, Label, TextInput } from '../components/flowbite-proxy'
import { supabase } from '../lib/supabase'

type Mode = 'password' | 'magic-link'

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicSent, setMagicSent] = useState(false)

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    if (error) {
      setError(error.message)
    } else {
      setMagicSent(true)
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
          <p className="mt-2 text-sm text-gray-500">Sign in to your account</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {/* Mode switcher */}
          <div className="mb-6 flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            {(['password', 'magic-link'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); setMagicSent(false) }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                  mode === m
                    ? 'bg-white text-[#D90429] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'password' ? 'Password' : 'Magic link'}
              </button>
            ))}
          </div>

          {error && <Alert color="failure" className="mb-4">{error}</Alert>}

          {magicSent ? (
            <Alert color="success">
              <span className="font-medium">Check your email!</span> We sent a magic link to{' '}
              <span className="font-medium">{email}</span>.
            </Alert>
          ) : (
            <form
              onSubmit={mode === 'password' ? handlePasswordLogin : handleMagicLink}
              className="flex flex-col gap-4"
            >
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

              {mode === 'password' && (
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" value="Password" color="pulse" />
                    <Link to="/reset-password" className="text-sm text-[#D90429] hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <TextInput
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    color="pulse"
                    className="mt-1"
                  />
                </div>
              )}

              <Button
                type="submit"
                color="pulse-primary"
                isProcessing={loading}
                disabled={loading}
                className="mt-2 w-full"
              >
                {mode === 'password' ? 'Sign in' : 'Send magic link'}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-[#D90429] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
