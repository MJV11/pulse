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

    // discovery_feed returns an empty array when the user has no stored location
    res.json({ data: data ?? [], ...(!data?.length && { reason: 'no_location' }) });
  } catch (err) {
    console.error('Unexpected error in GET /discovery:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

export { router as discoveryRouter };
