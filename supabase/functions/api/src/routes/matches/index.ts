// @deno-types="npm:@types/express@^4.17"
import express, { Request, Response } from 'npm:express@4.18.2';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { requireAuth } from '../../middlewares/auth.ts';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email?: string;
    [key: string]: unknown;
  };
}

function getServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseSecretKey = Deno.env.get('SUPABASE_SECRET_KEY');

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY environment variables');
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false },
  });
}

const router = express.Router();

/**
 * GET /api/matches
 * Returns all matches for the authenticated user, joined with each
 * matched user's profile from user_details.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;

  try {
    const supabase = getServiceClient();

    // Fetch all match rows where the authenticated user is the initiator
    const { data: matchRows, error: matchError } = await supabase
      .from('matches')
      .select('id, match_user_id, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (matchError) {
      console.error('Error fetching matches:', matchError);
      res.status(500).json({ error: { message: 'Failed to fetch matches' } });
      return;
    }

    if (!matchRows || matchRows.length === 0) {
      res.json({ data: [] });
      return;
    }

    // Fetch user_details for all matched users in one query
    const matchUserIds = matchRows.map((m) => m.match_user_id);
    const { data: profiles, error: profileError } = await supabase
      .from('user_details')
      .select('user_id, user_name, bio, sports, rating')
      .in('user_id', matchUserIds);

    if (profileError) {
      console.error('Error fetching user_details for matches:', profileError);
      res.status(500).json({ error: { message: 'Failed to fetch match profiles' } });
      return;
    }

    // Build a lookup map for O(1) profile access
    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    const data = matchRows.map((m) => ({
      match_id: m.id,
      matched_at: m.created_at,
      user: profileMap.get(m.match_user_id) ?? {
        user_id: m.match_user_id,
        user_name: null,
        bio: null,
        sports: [],
        rating: null,
      },
    }));

    res.json({ data });
  } catch (err) {
    console.error('Unexpected error in GET /matches:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

export { router as matchesRouter };
