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
 * POST /api/likes
 * Records a like from the authenticated user to another user.
 * If the target has already liked back, a match is created automatically
 * via the process_like RPC and `matched: true` is returned along with
 * the matched user's profile so the client can show a celebration.
 *
 * Body: { to_user_id: string }
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { id: fromUserId } = (req as AuthenticatedRequest).user;
  const { to_user_id } = req.body as { to_user_id?: string };

  if (!to_user_id || typeof to_user_id !== 'string') {
    res.status(400).json({ error: { message: '`to_user_id` is required' } });
    return;
  }
  /**if (to_user_id === fromUserId) {
    res.status(400).json({ error: { message: 'Cannot like yourself' } });
    return;
  }*/

  try {
    const { data, error } = await supabase.rpc('process_like', {
      p_from: fromUserId,
      p_to: to_user_id,
    });

    if (error) {
      console.error('Error calling process_like:', JSON.stringify(error));
      res.status(500).json({ error: { message: 'Failed to record like', detail: error.message } });
      return;
    }

    const result = (data as { matched: boolean; match_id: string | null }[])[0];
    const matched = result?.matched ?? false;
    const matchId = result?.match_id ?? null;

    if (!matched) {
      res.json({ data: { matched: false } });
      return;
    }

    // Fetch the matched user's profile + first photo to return to the client
    const { data: profileRows } = await supabase
      .from('user_details')
      .select('user_id, user_name, bio, sports, rating')
      .eq('user_id', to_user_id)
      .maybeSingle();

    const { data: photoRows } = await supabase
      .from('profile_photos')
      .select('storage_path')
      .eq('user_id', to_user_id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(1);

    res.json({
      data: {
        matched: true,
        match_id: matchId,
        user: {
          ...(profileRows ?? { user_id: to_user_id, user_name: null, bio: null, sports: [], rating: null }),
          first_photo_path: photoRows?.[0]?.storage_path ?? null,
        },
      },
    });
  } catch (err) {
    console.error('Unexpected error in POST /likes:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

export { router as likesRouter };
