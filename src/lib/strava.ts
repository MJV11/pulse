/**
 * Strava OAuth helpers.
 *
 * The client_id is a public OAuth identifier so it's safe to expose in the
 * browser (`VITE_STRAVA_CLIENT_ID`). The client_secret stays server-side and
 * is only used by the Edge Function during the token exchange.
 */

const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID as string | undefined

/** Path within the SPA where Strava redirects users after authorization. */
export const STRAVA_CALLBACK_PATH = '/integrations/strava/callback'

/** Default scopes — read public profile + all activities (incl. private). */
export const STRAVA_DEFAULT_SCOPES = 'read,activity:read_all'

/** Key used to round-trip the CSRF state token through sessionStorage. */
export const STRAVA_STATE_STORAGE_KEY = 'pulse:strava-oauth-state'

/** Computes the redirect URI relative to the current origin. */
export function getStravaRedirectUri(): string {
  return `${window.location.origin}${STRAVA_CALLBACK_PATH}`
}

/** True when the frontend has been built with a Strava client ID. */
export function isStravaConfigured(): boolean {
  return Boolean(STRAVA_CLIENT_ID)
}

/** Generates a random state string used to defend against CSRF on the callback. */
export function generateOAuthState(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Builds the full Strava authorization URL the user should be redirected to. */
export function buildStravaAuthUrl(state: string, scope: string = STRAVA_DEFAULT_SCOPES): string {
  if (!STRAVA_CLIENT_ID) {
    throw new Error('Missing VITE_STRAVA_CLIENT_ID — set it in your .env file.')
  }
  const url = new URL('https://www.strava.com/oauth/authorize')
  url.searchParams.set('client_id', STRAVA_CLIENT_ID)
  url.searchParams.set('redirect_uri', getStravaRedirectUri())
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('approval_prompt', 'auto')
  url.searchParams.set('scope', scope)
  url.searchParams.set('state', state)
  return url.toString()
}

/**
 * Kicks off the Strava OAuth flow by redirecting the browser to Strava.
 * Stores a fresh state token in sessionStorage so the callback page can
 * verify the response wasn't forged.
 */
export function startStravaOAuth(): void {
  const state = generateOAuthState()
  sessionStorage.setItem(STRAVA_STATE_STORAGE_KEY, state)
  window.location.assign(buildStravaAuthUrl(state))
}
