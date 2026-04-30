// @deno-types="npm:@types/express@^4.17"
import express, { Request, Response } from 'npm:express@4.18.2';
import { requireAuth } from '../../middlewares/auth.ts';
import { getServiceClient } from '../../utils/supabase.ts';
import { areUsersMatched } from '../../utils/matches.ts';
import { fetchStravaSnapshots } from '../../utils/strava.ts';

interface AuthenticatedRequest extends Request {
  user: { id: string; email?: string; [key: string]: unknown };
}

const router = express.Router();

const supabase = getServiceClient();

/**
 * GET /api/messages/conversations
 * Returns one entry per unique conversation partner, ordered by the most
 * recent message. Each entry includes the partner's user_details.
 */
router.get('/conversations', requireAuth, async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;

  try {

    // Fetch all messages involving this user, newest first
    const { data: msgs, error: msgErr } = await supabase
      .from('messages')
      .select('id, from_user_id, to_user_id, content, created_at')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (msgErr) {
      console.error('Error fetching conversations:', msgErr);
      res.status(500).json({ error: { message: 'Failed to fetch conversations' } });
      return;
    }

    if (!msgs || msgs.length === 0) {
      res.json({ data: [] });
      return;
    }

    // Keep only the most recent message per partner (msgs already sorted desc)
    const latestByPartner = new Map<string, typeof msgs[0]>();
    for (const msg of msgs) {
      const partnerId = msg.from_user_id === userId ? msg.to_user_id : msg.from_user_id;
      if (!latestByPartner.has(partnerId)) {
        latestByPartner.set(partnerId, msg);
      }
    }

    const partnerIds = Array.from(latestByPartner.keys());

    // Restrict to currently-matched partners. A user could have history
    // with someone they unmatched; we hide those threads from the list so
    // they can't be re-opened from the UI. Pre-existing messages stay in
    // the database — this is purely a visibility gate.
    const { data: matchRows, error: matchErr } = await supabase
      .from('matches')
      .select('user_id, match_user_id')
      .or(`user_id.eq.${userId},match_user_id.eq.${userId}`);
    if (matchErr) {
      console.error('Error filtering conversations by match:', matchErr);
      res.status(500).json({ error: { message: 'Failed to fetch conversations' } });
      return;
    }
    const matchedSet = new Set<string>();
    for (const m of matchRows ?? []) {
      matchedSet.add(m.user_id === userId ? m.match_user_id : m.user_id);
    }
    const visiblePartnerIds = partnerIds.filter((id) => matchedSet.has(id));

    if (visiblePartnerIds.length === 0) {
      res.json({ data: [] });
      return;
    }

    // Fetch user_details for all partners (forward-compat: select * and strip
    // the binary `location` column before sending). Anything new added to
    // user_details flows through automatically.
    const { data: profiles, error: profileErr } = await supabase
      .from('user_details')
      .select('*')
      .in('user_id', visiblePartnerIds);

    if (profileErr) {
      console.error('Error fetching partner profiles:', profileErr);
      res.status(500).json({ error: { message: 'Failed to fetch partner profiles' } });
      return;
    }

    // Pull each partner's first gallery photo (lowest position) so the
    // conversation list can render real avatars rather than initials.
    const { data: photos, error: photosErr } = await supabase
      .from('profile_photos')
      .select('user_id, storage_path, position, created_at')
      .in('user_id', visiblePartnerIds)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (photosErr) {
      console.error('Error fetching partner photos:', photosErr);
      res.status(500).json({ error: { message: 'Failed to fetch partner photos' } });
      return;
    }

    const firstPhotoByUser = new Map<string, string>();
    for (const p of photos ?? []) {
      if (!firstPhotoByUser.has(p.user_id)) {
        firstPhotoByUser.set(p.user_id, p.storage_path);
      }
    }

    const profileMap = new Map(
      (profiles ?? []).map((p) => {
        // deno-lint-ignore no-unused-vars
        const { location, ...rest } = p as Record<string, unknown> & { user_id: string };
        return [rest.user_id, rest];
      }),
    );

    // Strava snapshot per partner so the profile modal opened from the
    // messages page renders the same FTP + 14d activity panel as discovery.
    const stravaByUser = await fetchStravaSnapshots(visiblePartnerIds);

    const data = visiblePartnerIds.map((partnerId) => {
      const lastMsg = latestByPartner.get(partnerId)!;
      const profile = profileMap.get(partnerId) as
        | (Record<string, unknown> & { user_name?: string | null })
        | undefined;
      const strava = stravaByUser.get(partnerId);
      return {
        ...(profile ?? {}),
        partner_id: partnerId,
        partner_name: profile?.user_name ?? null,
        partner_first_photo_path: firstPhotoByUser.get(partnerId) ?? null,
        strava_ftp: strava?.strava_ftp ?? null,
        strava_stats: strava?.strava_stats ?? [],
        last_message: lastMsg.content,
        last_message_at: lastMsg.created_at,
        is_sent_by_me: lastMsg.from_user_id === userId,
      };
    });

    res.json({ data });
  } catch (err) {
    console.error('Unexpected error in GET /messages/conversations:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

/**
 * GET /api/messages/:userId
 * Returns the full message thread between the authenticated user and :userId,
 * ordered oldest-first so the UI can render top-to-bottom naturally.
 *
 * Gated on a mutual match — non-matched users get a 403. This keeps users
 * from peeking at threads with someone they unmatched, and from probing the
 * existence of a thread by user_id.
 */
router.get('/:userId', requireAuth, async (req: Request, res: Response) => {
  const { id: currentUserId } = (req as AuthenticatedRequest).user;
  const { userId: partnerId } = req.params;

  try {
    const matched = await areUsersMatched(currentUserId, partnerId);
    if (!matched) {
      res.status(403).json({
        error: { message: 'You can only view conversations with users you have matched with' },
      });
      return;
    }

    const { data, error } = await supabase
      .from('messages')
      .select('id, from_user_id, to_user_id, content, reacted_with, created_at, modified_at')
      .or(
        `and(from_user_id.eq.${currentUserId},to_user_id.eq.${partnerId}),` +
        `and(from_user_id.eq.${partnerId},to_user_id.eq.${currentUserId})`,
      )
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching thread:', error);
      res.status(500).json({ error: { message: 'Failed to fetch messages' } });
      return;
    }

    res.json({ data: data ?? [] });
  } catch (err) {
    console.error('Unexpected error in GET /messages/:userId:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

/**
 * POST /api/messages
 * Sends a message to another user. Gated on a mutual match — sending to a
 * non-matched user returns 403.
 * Body: { to_user_id: string, content: string }
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { id: fromUserId } = (req as AuthenticatedRequest).user;
  const { to_user_id, content } = req.body as { to_user_id?: string; content?: string };

  if (!to_user_id || typeof to_user_id !== 'string') {
    res.status(400).json({ error: { message: '`to_user_id` is required' } });
    return;
  }
  if (!content || typeof content !== 'string' || !content.trim()) {
    res.status(400).json({ error: { message: '`content` must be a non-empty string' } });
    return;
  }
  if (to_user_id === fromUserId) {
    res.status(400).json({ error: { message: 'Cannot send a message to yourself' } });
    return;
  }

  try {
    const matched = await areUsersMatched(fromUserId, to_user_id);
    if (!matched) {
      res.status(403).json({
        error: { message: 'You can only message users you have matched with' },
      });
      return;
    }

    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from('messages')
      .insert({ from_user_id: fromUserId, to_user_id, content: content.trim() })
      .select()
      .single();

    if (error) {
      console.error('Error inserting message:', error);
      res.status(500).json({ error: { message: 'Failed to send message' } });
      return;
    }

    res.status(201).json({ data });
  } catch (err) {
    console.error('Unexpected error in POST /messages:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

export { router as messagesRouter };
