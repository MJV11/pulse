// @deno-types="npm:@types/express@^4.17"
import express, { Request, Response } from 'npm:express@4.18.2';
import { requireAuth } from '../../middlewares/auth.ts';
import { getServiceClient } from '../../utils/supabase.ts';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email?: string;
    [key: string]: unknown;
  };
}

const supabase = getServiceClient();

const router = express.Router();

/**
 * GET /api/matches
 * Returns all mutual matches for the authenticated user.
 * Each item includes the matched user's profile and their first gallery photo.
 *
 * Matches are stored with canonical ordering (smaller UUID as user_id), so we
 * query both directions with `.or()` and derive the "other" user from context.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;

  try {
    // Query matches where the user is on either side
    const { data: matchRows, error: matchError } = await supabase
      .from('matches')
      .select('id, user_id, match_user_id, created_at')
      .or(`user_id.eq.${userId},match_user_id.eq.${userId}`)
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

    // The "other" user in each match
    const otherUserIds = matchRows.map((m) =>
      m.user_id === userId ? m.match_user_id : m.user_id
    );

    // Fetch profiles for all matched users in one query
    const { data: profiles, error: profileError } = await supabase
      .from('user_details')
      .select('user_id, user_name, bio, sports, rating')
      .in('user_id', otherUserIds);

    if (profileError) {
      console.error('Error fetching user_details for matches:', profileError);
      res.status(500).json({ error: { message: 'Failed to fetch match profiles' } });
      return;
    }

    // Fetch first gallery photo for each matched user
    // Order by position then created_at; take the first per user in JS
    const { data: photoRows, error: photoError } = await supabase
      .from('profile_photos')
      .select('user_id, storage_path')
      .in('user_id', otherUserIds)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (photoError) {
      console.error('Error fetching photos for matches:', photoError);
      // Non-fatal — proceed without photos
    }

    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    // Build first-photo map (first occurrence per user after ordering)
    const photoMap = new Map<string, string>();
    for (const photo of (photoRows ?? [])) {
      if (!photoMap.has(photo.user_id)) {
        photoMap.set(photo.user_id, photo.storage_path);
      }
    }

    const data = matchRows.map((m) => {
      const otherId = m.user_id === userId ? m.match_user_id : m.user_id;
      const profile = profileMap.get(otherId);
      return {
        match_id: m.id,
        matched_at: m.created_at,
        user: {
          user_id: otherId,
          user_name: profile?.user_name ?? null,
          bio: profile?.bio ?? null,
          sports: profile?.sports ?? [],
          rating: profile?.rating ?? null,
          first_photo_path: photoMap.get(otherId) ?? null,
        },
      };
    });

    res.json({ data });
  } catch (err) {
    console.error('Unexpected error in GET /matches:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

export { router as matchesRouter };
