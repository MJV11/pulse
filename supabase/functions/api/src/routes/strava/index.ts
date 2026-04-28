// @deno-types="npm:@types/express@^4.17"
import express, { Request, Response } from 'npm:express@4.18.2';
import { requireAuth } from '../../middlewares/auth.ts';
import { getServiceClient } from '../../utils/supabase.ts';

interface AuthenticatedRequest extends Request {
  user: { id: string; email?: string; [key: string]: unknown };
}

interface StravaTokenResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete?: {
    id: number;
    username: string | null;
    firstname: string | null;
    lastname: string | null;
    profile: string | null;
  };
}

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_DEAUTH_URL = 'https://www.strava.com/oauth/deauthorize';

const router = express.Router();
const supabase = getServiceClient();

function getStravaCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = Deno.env.get('STRAVA_CLIENT_ID');
  const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

/**
 * GET /api/strava/status
 * Returns whether the authenticated user has linked a Strava account, plus
 * a small public-safe athlete profile when connected. Tokens are never
 * returned to the client.
 */
router.get('/status', requireAuth, async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;

  try {
    const { data, error } = await supabase
      .from('strava_connections')
      .select(
        'strava_athlete_id, athlete_username, athlete_firstname, athlete_lastname, athlete_profile_url, scope, connected_at',
      )
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching Strava status:', error);
      res.status(500).json({ error: { message: 'Failed to fetch Strava status' } });
      return;
    }

    if (!data) {
      res.json({ data: { connected: false, athlete: null, connected_at: null, scope: null } });
      return;
    }

    res.json({
      data: {
        connected: true,
        connected_at: data.connected_at,
        scope: data.scope,
        athlete: {
          id: data.strava_athlete_id,
          username: data.athlete_username,
          firstname: data.athlete_firstname,
          lastname: data.athlete_lastname,
          profile: data.athlete_profile_url,
        },
      },
    });
  } catch (err) {
    console.error('Unexpected error in GET /strava/status:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

/**
 * POST /api/strava/connect
 * Exchanges a Strava OAuth authorization code for tokens and persists the
 * connection for the authenticated user. The full token-exchange flow happens
 * here (server-side) so the client_secret never reaches the browser.
 *
 * Body: { code: string, scope?: string }
 */
router.post('/connect', requireAuth, async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;
  const { code, scope } = req.body as { code?: string; scope?: string };

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: { message: '`code` is required' } });
    return;
  }

  const creds = getStravaCredentials();
  if (!creds) {
    res
      .status(500)
      .json({ error: { message: 'Strava integration is not configured on the server' } });
    return;
  }

  try {
    // Exchange the auth code for an access + refresh token pair
    const tokenRes = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const detail = await tokenRes.text();
      console.error('Strava token exchange failed:', tokenRes.status, detail);
      res
        .status(502)
        .json({ error: { message: 'Strava token exchange failed', detail } });
      return;
    }

    const token = (await tokenRes.json()) as StravaTokenResponse;
    if (!token.access_token || !token.refresh_token || !token.athlete?.id) {
      console.error('Unexpected Strava token response shape:', token);
      res.status(502).json({ error: { message: 'Invalid response from Strava' } });
      return;
    }

    const { error: upsertError } = await supabase
      .from('strava_connections')
      .upsert(
        {
          user_id: userId,
          strava_athlete_id: token.athlete.id,
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          expires_at: new Date(token.expires_at * 1000).toISOString(),
          scope: scope ?? null,
          athlete_username: token.athlete.username ?? null,
          athlete_firstname: token.athlete.firstname ?? null,
          athlete_lastname: token.athlete.lastname ?? null,
          athlete_profile_url: token.athlete.profile ?? null,
        },
        { onConflict: 'user_id' },
      );

    if (upsertError) {
      console.error('Failed to persist Strava connection:', upsertError);
      res.status(500).json({ error: { message: 'Failed to save Strava connection' } });
      return;
    }

    res.status(201).json({
      data: {
        connected: true,
        athlete: {
          id: token.athlete.id,
          username: token.athlete.username,
          firstname: token.athlete.firstname,
          lastname: token.athlete.lastname,
          profile: token.athlete.profile,
        },
      },
    });
  } catch (err) {
    console.error('Unexpected error in POST /strava/connect:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

/**
 * DELETE /api/strava/disconnect
 * Revokes the Strava token at Strava's end (best-effort) and removes the
 * connection row for the authenticated user.
 */
router.delete('/disconnect', requireAuth, async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;

  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('strava_connections')
      .select('access_token')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchErr) {
      console.error('Error fetching Strava connection for disconnect:', fetchErr);
      res.status(500).json({ error: { message: 'Failed to disconnect Strava' } });
      return;
    }

    // Best-effort revoke at Strava — don't block the disconnect if it fails
    if (existing?.access_token) {
      try {
        await fetch(STRAVA_DEAUTH_URL, {
          method: 'POST',
          headers: { Authorization: `Bearer ${existing.access_token}` },
        });
      } catch (err) {
        console.warn('Strava deauthorize call failed (non-fatal):', err);
      }
    }

    const { error: deleteErr } = await supabase
      .from('strava_connections')
      .delete()
      .eq('user_id', userId);

    if (deleteErr) {
      console.error('Failed to delete Strava connection:', deleteErr);
      res.status(500).json({ error: { message: 'Failed to disconnect Strava' } });
      return;
    }

    res.json({ data: { connected: false } });
  } catch (err) {
    console.error('Unexpected error in DELETE /strava/disconnect:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

export { router as stravaRouter };
