// @deno-types="npm:@types/express@^4.17"
import express, { Request, Response } from 'npm:express@4.18.2';
import { getServiceClient, getUserClient } from '../../utils/supabase.ts';
import { requireAuth } from '../../middlewares/auth.ts';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email?: string;
    [key: string]: unknown;
  };
}


const router = express.Router();

const supabase = getServiceClient();
/**
 * GET /api/users/me
 * Returns the authenticated user's profile from user_details.
 * If no row exists yet, returns { data: null }.
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;

  try {
    const { data, error } = await supabase
      .from('user_details')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user_details:', JSON.stringify(error));
      res.status(500).json({ error: { message: 'Failed to fetch user profile', detail: error.message } });
      return;
    }

    res.json({ data });
  } catch (err) {
    console.error('Unexpected error in GET /users/me:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

/**
 * PUT /api/users/me
 * Upserts the authenticated user's profile.
 * Uses the user's own JWT so auth.uid() is set and RLS is satisfied.
 * Accepted body fields: user_name, bio, sports
 */
router.put('/me', requireAuth, async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;
  const token = (req.headers.authorization as string).slice(7);

  const { user_name, bio, sports } = req.body as {
    user_name?: string;
    bio?: string;
    sports?: string[];
  };

  if (sports !== undefined && !Array.isArray(sports)) {
    res.status(400).json({ error: { message: '`sports` must be an array of strings' } });
    return;
  }

  if (sports !== undefined && !sports.every((s) => typeof s === 'string')) {
    res.status(400).json({ error: { message: '`sports` must contain only strings' } });
    return;
  }

  const patch: Record<string, unknown> = { user_id: userId };
  if (user_name !== undefined) patch.user_name = user_name;
  if (bio !== undefined) patch.bio = bio;
  if (sports !== undefined) patch.sports = sports;

  try {
    // Use the user's own client — this sets auth.uid() so RLS is satisfied
    const supabase = getUserClient(token);
    const { data, error } = await supabase
      .from('user_details')
      .upsert(patch, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting user_details:', JSON.stringify(error));
      res.status(500).json({ error: { message: 'Failed to update user profile', detail: error.message } });
      return;
    }

    res.json({ data });
  } catch (err) {
    console.error('Unexpected error in PUT /users/me:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

/**
 * PUT /api/users/location
 * Stores the authenticated user's current geographic coordinates.
 * Body: { latitude: number, longitude: number }
 */
router.put('/location', requireAuth, async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;
  const { latitude, longitude } = req.body as { latitude?: unknown; longitude?: unknown };

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    res.status(400).json({ error: { message: '`latitude` and `longitude` must be numbers' } });
    return;
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    res.status(400).json({ error: { message: 'Coordinates out of range' } });
    return;
  }

  try {
    const { error } = await supabase.rpc('update_user_location', {
      p_user_id: userId,
      p_lat: latitude,
      p_lng: longitude,
    });

    if (error) {
      console.error('Error updating location:', JSON.stringify(error));
      res.status(500).json({ error: { message: 'Failed to update location', detail: error.message } });
      return;
    }

    res.json({ data: { latitude, longitude } });
  } catch (err) {
    console.error('Unexpected error in PUT /users/location:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

export { router as usersRouter };
