// @deno-types="npm:@types/express@^4.17"
import express, { Request, Response } from 'npm:express@4.18.2';
import { getServiceClient } from '../../utils/supabase.ts';
import { requireAuth } from '../../middlewares/auth.ts';

interface AuthenticatedRequest extends Request {
  user: { id: string; email?: string; [key: string]: unknown };
}

const router = express.Router();

const supabase = getServiceClient();

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
    const { data, error } = await supabase.rpc('discovery_feed', {
      p_user_id: userId,
      radius_miles: miles,
    });

    if (error) {
      console.error('Error calling discovery_feed:', error);
      res.status(500).json({ error: { message: 'Failed to fetch nearby users' } });
      return;
    }

    // The RPC returns rows of { user_data: jsonb, first_photo_path, distance_miles }.
    // Flatten the user_data fields up so the client gets a flat object — and any
    // new column added to user_details automatically rides along.
    const rows = (data ?? []) as Array<{
      user_data: Record<string, unknown>;
      first_photo_path: string | null;
      distance_miles: number;
    }>;
    const flat = rows.map((r) => ({
      ...(r.user_data ?? {}),
      first_photo_path: r.first_photo_path,
      distance_miles: r.distance_miles,
    }));

    // discovery_feed returns an empty array when the user has no stored location
    res.json({ data: flat, ...(!flat.length && { reason: 'no_location' }) });
  } catch (err) {
    console.error('Unexpected error in GET /discovery:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

export { router as discoveryRouter };
