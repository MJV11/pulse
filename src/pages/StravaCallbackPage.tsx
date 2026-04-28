import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import { STRAVA_STATE_STORAGE_KEY } from '../lib/strava'

/**
 * Landing page that Strava redirects users back to after they approve (or
 * deny) the OAuth prompt. Validates the state token, hands the auth code to
 * the backend for token exchange, then bounces back to the profile page.
 *
 * Wired into the router at `/integrations/strava/callback`.
 */
export function StravaCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  // Guard against React 18 strict-mode double-invocation consuming the code twice
  const ranRef = useRef(false)

  useEffect(() => {
    if (authLoading) return
    if (ranRef.current) return

    if (!session?.access_token) {
      setError('You must be signed in to connect Strava.')
      return
    }

    const code = params.get('code')
    const stravaError = params.get('error')
    const stateParam = params.get('state')
    const scope = params.get('scope') ?? undefined
    const expectedState = sessionStorage.getItem(STRAVA_STATE_STORAGE_KEY)

    if (stravaError) {
      setError(`Strava authorization was declined (${stravaError}).`)
      sessionStorage.removeItem(STRAVA_STATE_STORAGE_KEY)
      return
    }
    if (!code) {
      setError('Strava did not return an authorization code.')
      sessionStorage.removeItem(STRAVA_STATE_STORAGE_KEY)
      return
    }
    if (!stateParam || stateParam !== expectedState) {
      setError('Invalid OAuth state — please try connecting again.')
      sessionStorage.removeItem(STRAVA_STATE_STORAGE_KEY)
      return
    }

    ranRef.current = true
    sessionStorage.removeItem(STRAVA_STATE_STORAGE_KEY)

    apiFetch('/strava/connect', session.access_token, {
      method: 'POST',
      body: JSON.stringify({ code, scope }),
    })
      .then(() => navigate('/profile?strava=connected', { replace: true }))
      .catch((err: Error) => setError(err.message))
  }, [params, session, authLoading, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbf8ff] px-6">
      <div className="bg-white rounded-3xl shadow-[0px_8px_30px_0px_rgba(0,0,0,0.06)] p-10 max-w-md w-full text-center flex flex-col gap-4">
        {error ? (
          <>
            <h1 className="text-[#1d1a20] font-bold text-xl">Strava connection failed</h1>
            <p className="text-[#94a3b8] text-sm">{error}</p>
            <button
              onClick={() => navigate('/profile', { replace: true })}
              className="mt-2 self-center px-5 py-2 rounded-full bg-[#dc2626] text-white font-semibold text-sm hover:bg-[#b91c1c] transition-colors"
            >
              Back to Profile
            </button>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full border-2 border-[#dc2626] border-t-transparent animate-spin self-center" />
            <h1 className="text-[#1d1a20] font-bold text-xl">Connecting Strava…</h1>
            <p className="text-[#94a3b8] text-sm">
              Hang tight, this only takes a moment.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
