import { useState } from 'react'
import { useStravaConnection } from '../../hooks/useStravaConnection'
import { isStravaConfigured, startStravaOAuth } from '../../lib/strava'

const STRAVA_ORANGE = '#fc4c02'

function StravaLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="white" className={className} aria-hidden="true">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0l-7 13.828h4.172" />
    </svg>
  )
}

/**
 * Settings row that lets the user connect or disconnect their Strava account.
 * Persists across logins because the connection lives in the
 * `strava_connections` table on the server.
 */
export function StravaIntegrationRow() {
  const { status, loading, error, disconnect } = useStravaConnection()
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const configured = isStravaConfigured()
  const connected = Boolean(status?.connected)
  const athlete = status?.athlete ?? null

  const displayName = (() => {
    if (!athlete) return null
    const composed = [athlete.firstname, athlete.lastname].filter(Boolean).join(' ').trim()
    if (composed) return composed
    return athlete.username ?? `Athlete #${athlete.id}`
  })()

  const description = (() => {
    if (loading) return 'Checking connection…'
    if (!configured) return 'Set VITE_STRAVA_CLIENT_ID to enable this integration'
    if (error) return error
    if (connected && displayName) return `Connected as ${displayName}`
    return 'Sync your runs, rides, and workouts'
  })()

  function handleConnect() {
    setActionError(null)
    try {
      startStravaOAuth()
    } catch (err) {
      setActionError((err as Error).message)
    }
  }

  async function handleDisconnect() {
    setActionError(null)
    setBusy(true)
    try {
      await disconnect()
    } catch (err) {
      setActionError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-[#fef2f2]/30 transition-colors">
      <div className="flex items-center gap-4 min-w-0">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: STRAVA_ORANGE }}
        >
          <StravaLogo className="w-6 h-6" />
        </div>
        <div className="flex flex-col gap-px min-w-0">
          <span className="text-[#1d1a20] font-semibold text-[14px]">Strava</span>
          <span className="text-[#534342] font-medium text-xs truncate">
            {actionError ?? description}
          </span>
        </div>
      </div>

      {connected ? (
        <button
          onClick={handleDisconnect}
          disabled={busy || loading}
          className="text-[#dc2626] font-semibold text-sm px-4 py-2 rounded-full border border-[#fecaca] hover:bg-[#fef2f2] transition-colors disabled:opacity-60"
        >
          {busy ? 'Disconnecting…' : 'Disconnect'}
        </button>
      ) : (
        <button
          onClick={handleConnect}
          disabled={loading || !configured}
          className="text-white font-semibold text-sm px-4 py-2 rounded-full transition-opacity disabled:opacity-60 hover:opacity-90"
          style={{ background: STRAVA_ORANGE }}
        >
          Connect
        </button>
      )}
    </div>
  )
}
