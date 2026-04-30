// @deno-types="npm:@types/express@^4.17"
import express, { Request, Response } from 'npm:express@4.18.2';
import { requireAuth } from '../../middlewares/auth.ts';
import { getServiceClient } from '../../utils/supabase.ts';
import { fetchStravaSnapshots } from '../../utils/strava.ts';

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

    // Fetch full profiles for all matched users in one query. Selecting *
    // keeps this forward-compatible — any new user_details column flows
    // through the response automatically.
    const { data: profiles, error: profileError } = await supabase
      .from('user_details')
      .select('*')
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

    // Drop the binary geography column before sending; everything else
    // from user_details flows through.
    const profileMap = new Map(
      (profiles ?? []).map((p) => {
        const { location: _location, ...rest } = p as Record<string, unknown> & { user_id: string };
        return [rest.user_id as string, rest];
      }),
    );

    // Build first-photo map (first occurrence per user after ordering)
    const photoMap = new Map<string, string>();
    for (const photo of (photoRows ?? [])) {
      if (!photoMap.has(photo.user_id)) {
        photoMap.set(photo.user_id, photo.storage_path);
      }
    }

    // Strava snapshot per match — same shape that nearby_users emits so the
    // discovery profile modal renders identically on the matches page.
    const stravaByUser = await fetchStravaSnapshots(otherUserIds);

    const data = matchRows.map((m) => {
      const otherId = m.user_id === userId ? m.match_user_id : m.user_id;
      const profile = profileMap.get(otherId);
      const strava = stravaByUser.get(otherId);
      return {
        match_id: m.id,
        matched_at: m.created_at,
        user: {
          ...(profile ?? { user_id: otherId }),
          user_id: otherId,
          first_photo_path: photoMap.get(otherId) ?? null,
          strava_ftp: strava?.strava_ftp ?? null,
          strava_stats: strava?.strava_stats ?? [],
        },
      };
    });

    res.json({ data });
  } catch (err) {
    console.error('Unexpected error in GET /matches:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

/**
 * DELETE /api/matches/:userId
 * Unmatches the authenticated user from `:userId`. Removes the match row,
 * both like rows (so the pair can be rediscovered later), and the entire
 * message thread between them.
 *
 * Idempotent — returns 204 even if there was no match to remove.
 */
router.delete('/:userId', requireAuth, async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;
  const otherId = req.params.userId;

  if (!otherId || otherId === userId) {
    res.status(400).json({ error: { message: 'Invalid unmatch target' } });
    return;
  }

  try {
    // Match — query both directions because the row uses canonical ordering
    const { error: matchErr } = await supabase
      .from('matches')
      .delete()
      .or(
        `and(user_id.eq.${userId},match_user_id.eq.${otherId}),` +
        `and(user_id.eq.${otherId},match_user_id.eq.${userId})`,
      );

    if (matchErr) {
      console.error('Error deleting match:', matchErr);
      res.status(500).json({ error: { message: 'Failed to unmatch' } });
      return;
    }

    // Likes — both directions so the pair can rediscover each other later
    const { error: likeErr } = await supabase
      .from('likes')
      .delete()
      .or(
        `and(from_user_id.eq.${userId},to_user_id.eq.${otherId}),` +
        `and(from_user_id.eq.${otherId},to_user_id.eq.${userId})`,
      );

    if (likeErr) {
      console.error('Error deleting likes during unmatch:', likeErr);
      // Non-fatal — the match itself is already gone
    }

    // Message history — clean up the thread so the conversation disappears
    // from both sides. Mirrors standard dating-app unmatch UX.
    const { error: msgErr } = await supabase
      .from('messages')
      .delete()
      .or(
        `and(from_user_id.eq.${userId},to_user_id.eq.${otherId}),` +
        `and(from_user_id.eq.${otherId},to_user_id.eq.${userId})`,
      );

    if (msgErr) {
      console.error('Error deleting messages during unmatch:', msgErr);
      // Non-fatal — gating still hides them from the UI
    }

    res.status(204).end();
  } catch (err) {
    console.error('Unexpected error in DELETE /matches/:userId:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

export { router as matchesRouter };
