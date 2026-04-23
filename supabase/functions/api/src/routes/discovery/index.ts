// @deno-types="npm:@types/express@^4.17"
import express, { Request, Response } from 'npm:express@4.18.2';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { requireAuth } from '../../middlewares/auth.ts';

interface AuthenticatedRequest extends Request {
  user: { id: string; email?: string; [key: string]: unknown };
}

function getServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseSecretKey = Deno.env.get('SUPABASE_SECRET_KEY');
  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY');
  }
  return createClient(supabaseUrl, supabaseSecretKey, { auth: { persistSession: false } });
}

const router = express.Router();

/**
 * GET /api/discovery?miles=50
 *
 * Returns all user_details rows within `miles` of the authenticated user's
 * stored location, ordered by distance ascending.
 *
 * If the current user has no stored location yet, returns an empty array so
 * the frontend can prompt them to share their location.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;
  const miles = Math.min(500, Math.max(1, Number(req.query.miles) || 50));

  try {
    const supabase = getServiceClient();

    // Fetch the current user's stored location
    const { data: me, error: meErr } = await supabase
      .from('user_details')
      .select('location')
      .eq('user_id', userId)
      .maybeSingle();

    if (meErr) {
      console.error('Error fetching current user location:', meErr);
      res.status(500).json({ error: { message: 'Failed to read your location' } });
      return;
    }

    // No location stored yet — caller should POST location first
    if (!me?.location) {
      res.json({ data: [], reason: 'no_location' });
      return;
    }

    // Call the PostGIS nearby_users function
    const { data, error } = await supabase.rpc('nearby_users', {
      lat: (me.location as { coordinates: [number, number] }).coordinates[1],
      lng: (me.location as { coordinates: [number, number] }).coordinates[0],
      radius_miles: miles,
      exclude_user_id: userId,
    });

    if (error) {
      console.error('Error calling nearby_users:', error);
      res.status(500).json({ error: { message: 'Failed to fetch nearby users' } });
      return;
    }

    res.json({ data: data ?? [] });
  } catch (err) {
    console.error('Unexpected error in GET /discovery:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

export { router as discoveryRouter };
