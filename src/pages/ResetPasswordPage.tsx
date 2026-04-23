import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, Label, TextInput } from '../components/flowbite-proxy'
import { supabase } from '../lib/supabase'

export function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
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
          <p className="mt-2 text-sm text-gray-500">Reset your password</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {error && <Alert color="failure" className="mb-4">{error}</Alert>}

          {sent ? (
            <Alert color="success">
              <p className="font-medium">Check your email!</p>
              <p className="mt-1 text-sm">
                A password reset link was sent to <span className="font-medium">{email}</span>.
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

              <Button
                type="submit"
                color="pulse-primary"
                isProcessing={loading}
                disabled={loading}
                className="mt-2 w-full"
              >
                Send reset link
              </Button>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-gray-500">
            <Link to="/login" className="font-medium text-[#D90429] hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
