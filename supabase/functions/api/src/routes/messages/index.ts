// @deno-types="npm:@types/express@^4.17"
import express, { Request, Response } from 'npm:express@4.18.2';
import { requireAuth } from '../../middlewares/auth.ts';
import { getServiceClient } from '../../utils/supabase.ts';

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

    // Fetch user_details for all partners
    const { data: profiles, error: profileErr } = await supabase
      .from('user_details')
      .select('user_id, user_name, bio')
      .in('user_id', partnerIds);

    if (profileErr) {
      console.error('Error fetching partner profiles:', profileErr);
      res.status(500).json({ error: { message: 'Failed to fetch partner profiles' } });
      return;
    }

    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    const data = partnerIds.map((partnerId) => {
      const lastMsg = latestByPartner.get(partnerId)!;
      const profile = profileMap.get(partnerId);
      return {
        partner_id: partnerId,
        partner_name: profile?.user_name ?? null,
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
 */
router.get('/:userId', requireAuth, async (req: Request, res: Response) => {
  const { id: currentUserId } = (req as AuthenticatedRequest).user;
  const { userId: partnerId } = req.params;

  try {
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
 * Sends a message to another user.
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
  /** if (to_user_id === fromUserId) {
    res.status(400).json({ error: { message: 'Cannot send a message to yourself' } });
    return;
  } */

  try {
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
