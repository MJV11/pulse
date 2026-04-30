// @deno-types="npm:@types/express@^4.17"
import express, { Request, Response } from 'npm:express@4.18.2';
import { getServiceClient } from '../../utils/supabase.ts';
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
      .rpc('get_user_profile', { p_user_id: userId })
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
 * Accepted body fields: user_name, bio, birthday (YYYY-MM-DD), sports,
 * gender ('man' | 'woman' | 'nonbinary'),
 * looking_for ('man' | 'woman' | 'nonbinary' | 'all'),
 * min_age_pref (integer 18–99), max_age_pref (integer 18–99, >= min_age_pref),
 * min_ftp_pref (integer 50–500), max_ftp_pref (integer 50–500, >= min_ftp_pref),
 * require_ftp (boolean — when true, discovery hides users without a known FTP).
 */
const ALLOWED_GENDERS = new Set(['man', 'woman', 'nonbinary']);
const ALLOWED_LOOKING_FOR = new Set(['man', 'woman', 'nonbinary', 'all']);
const FTP_MIN = 50;
const FTP_MAX = 500;

router.put('/me', requireAuth, async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;

  const {
    user_name,
    bio,
    birthday,
    sports,
    gender,
    looking_for,
    min_age_pref,
    max_age_pref,
    min_ftp_pref,
    max_ftp_pref,
    require_ftp,
  } = req.body as {
    user_name?: string;
    bio?: string;
    birthday?: string | null;
    sports?: string[];
    gender?: string | null;
    looking_for?: string | null;
    min_age_pref?: unknown;
    max_age_pref?: unknown;
    min_ftp_pref?: unknown;
    max_ftp_pref?: unknown;
    require_ftp?: unknown;
  };

  if (sports !== undefined && !Array.isArray(sports)) {
    res.status(400).json({ error: { message: '`sports` must be an array of strings' } });
    return;
  }

  if (sports !== undefined && !sports.every((s) => typeof s === 'string')) {
    res.status(400).json({ error: { message: '`sports` must contain only strings' } });
    return;
  }

  if (gender !== undefined && gender !== null && !ALLOWED_GENDERS.has(gender)) {
    res.status(400).json({
      error: { message: '`gender` must be one of "man", "woman", "nonbinary"' },
    });
    return;
  }

  if (
    looking_for !== undefined &&
    looking_for !== null &&
    !ALLOWED_LOOKING_FOR.has(looking_for)
  ) {
    res.status(400).json({
      error: { message: '`looking_for` must be one of "man", "woman", "nonbinary", "all"' },
    });
    return;
  }

  // min_age_pref / max_age_pref: integers in [18, 99], min ≤ max
  if (min_age_pref !== undefined) {
    if (typeof min_age_pref !== 'number' || !Number.isInteger(min_age_pref) || min_age_pref < 18 || min_age_pref > 99) {
      res.status(400).json({ error: { message: '`min_age_pref` must be an integer between 18 and 99' } });
      return;
    }
  }

  if (max_age_pref !== undefined) {
    if (typeof max_age_pref !== 'number' || !Number.isInteger(max_age_pref) || max_age_pref < 18 || max_age_pref > 99) {
      res.status(400).json({ error: { message: '`max_age_pref` must be an integer between 18 and 99' } });
      return;
    }
  }

  if (min_age_pref !== undefined && max_age_pref !== undefined && (min_age_pref as number) > (max_age_pref as number)) {
    res.status(400).json({ error: { message: '`min_age_pref` must be less than or equal to `max_age_pref`' } });
    return;
  }

  // min_ftp_pref / max_ftp_pref: integers in [50, 500], min ≤ max
  if (min_ftp_pref !== undefined) {
    if (
      typeof min_ftp_pref !== 'number' ||
      !Number.isInteger(min_ftp_pref) ||
      min_ftp_pref < FTP_MIN ||
      min_ftp_pref > FTP_MAX
    ) {
      res
        .status(400)
        .json({ error: { message: `\`min_ftp_pref\` must be an integer between ${FTP_MIN} and ${FTP_MAX}` } });
      return;
    }
  }

  if (max_ftp_pref !== undefined) {
    if (
      typeof max_ftp_pref !== 'number' ||
      !Number.isInteger(max_ftp_pref) ||
      max_ftp_pref < FTP_MIN ||
      max_ftp_pref > FTP_MAX
    ) {
      res
        .status(400)
        .json({ error: { message: `\`max_ftp_pref\` must be an integer between ${FTP_MIN} and ${FTP_MAX}` } });
      return;
    }
  }

  if (
    min_ftp_pref !== undefined &&
    max_ftp_pref !== undefined &&
    (min_ftp_pref as number) > (max_ftp_pref as number)
  ) {
    res.status(400).json({ error: { message: '`min_ftp_pref` must be less than or equal to `max_ftp_pref`' } });
    return;
  }

  if (require_ftp !== undefined && typeof require_ftp !== 'boolean') {
    res.status(400).json({ error: { message: '`require_ftp` must be a boolean' } });
    return;
  }

  // birthday must be either null (clear) or a YYYY-MM-DD string within range
  if (birthday !== undefined && birthday !== null) {
    if (typeof birthday !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
      res.status(400).json({ error: { message: '`birthday` must be a YYYY-MM-DD date' } });
      return;
    }
    const parsed = new Date(`${birthday}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) {
      res.status(400).json({ error: { message: '`birthday` is not a valid date' } });
      return;
    }
    const now = new Date();
    if (parsed.getTime() > now.getTime()) {
      res.status(400).json({ error: { message: '`birthday` cannot be in the future' } });
      return;
    }
    // Minimum age 13 — keep loose at the API; product can enforce stricter on the client
    const minAdult = new Date(now);
    minAdult.setUTCFullYear(now.getUTCFullYear() - 13);
    if (parsed.getTime() > minAdult.getTime()) {
      res.status(400).json({ error: { message: 'You must be at least 13 years old' } });
      return;
    }
  }

  const patch: Record<string, unknown> = { user_id: userId };
  if (user_name !== undefined) patch.user_name = user_name;
  if (bio !== undefined) patch.bio = bio;
  if (birthday !== undefined) patch.birthday = birthday;
  if (sports !== undefined) patch.sports = sports;
  if (gender !== undefined) patch.gender = gender;
  if (looking_for !== undefined) patch.looking_for = looking_for;
  if (min_age_pref !== undefined) patch.min_age_pref = min_age_pref;
  if (max_age_pref !== undefined) patch.max_age_pref = max_age_pref;
  if (min_ftp_pref !== undefined) patch.min_ftp_pref = min_ftp_pref;
  if (max_ftp_pref !== undefined) patch.max_ftp_pref = max_ftp_pref;
  if (require_ftp !== undefined) patch.require_ftp = require_ftp;

  try {
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
 * GET /api/users/me/photos
 * Returns the authenticated user's gallery photos ordered by position, then created_at.
 */
router.get('/me/photos', requireAuth, async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;

  try {
    const { data, error } = await supabase
      .from('profile_photos')
      .select('id, storage_path, position, created_at')
      .eq('user_id', userId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching profile_photos:', JSON.stringify(error));
      res.status(500).json({ error: { message: 'Failed to fetch photos', detail: error.message } });
      return;
    }

    res.json({ data: data ?? [] });
  } catch (err) {
    console.error('Unexpected error in GET /users/me/photos:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

/**
 * POST /api/users/me/photos
 * Records a new gallery photo after the client has uploaded to storage.
 * Body: { storage_path: string, position?: number }
 */
router.post('/me/photos', requireAuth, async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;
  const { storage_path, position } = req.body as { storage_path?: unknown; position?: unknown };

  if (typeof storage_path !== 'string' || !storage_path.trim()) {
    res.status(400).json({ error: { message: '`storage_path` is required' } });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('profile_photos')
      .insert({
        user_id: userId,
        storage_path: storage_path.trim(),
        position: typeof position === 'number' ? position : 0,
      })
      .select('id, storage_path, position, created_at')
      .single();

    if (error) {
      console.error('Error inserting profile_photo:', JSON.stringify(error));
      res.status(500).json({ error: { message: 'Failed to save photo', detail: error.message } });
      return;
    }

    res.status(201).json({ data });
  } catch (err) {
    console.error('Unexpected error in POST /users/me/photos:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

/**
 * DELETE /api/users/me/photos/:photoId
 * Deletes the photo record and removes the file from storage.
 */
router.delete('/me/photos/:photoId', requireAuth, async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;
  const { photoId } = req.params;

  try {
    // Fetch the record first to get the storage_path and verify ownership
    const { data: photo, error: fetchError } = await supabase
      .from('profile_photos')
      .select('id, storage_path, user_id')
      .eq('id', photoId)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      res.status(500).json({ error: { message: 'Failed to fetch photo', detail: fetchError.message } });
      return;
    }

    if (!photo) {
      res.status(404).json({ error: { message: 'Photo not found' } });
      return;
    }

    // Remove from storage (best-effort — don't fail the request if file is already gone)
    await supabase.storage.from('gallery').remove([photo.storage_path]);

    // Delete the DB record
    const { error: deleteError } = await supabase
      .from('profile_photos')
      .delete()
      .eq('id', photoId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting profile_photo record:', JSON.stringify(deleteError));
      res.status(500).json({ error: { message: 'Failed to delete photo', detail: deleteError.message } });
      return;
    }

    res.json({ data: { id: photoId } });
  } catch (err) {
    console.error('Unexpected error in DELETE /users/me/photos/:photoId:', err);
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

/**
 * GET /api/users/:userId/photos
 * Returns the gallery photos for any user (public, authenticated read).
 */
router.get('/:userId/photos', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const { data, error } = await supabase
      .from('profile_photos')
      .select('id, storage_path, position, created_at')
      .eq('user_id', userId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching profile_photos for user:', JSON.stringify(error));
      res.status(500).json({ error: { message: 'Failed to fetch photos', detail: error.message } });
      return;
    }

    res.json({ data: data ?? [] });
  } catch (err) {
    console.error('Unexpected error in GET /users/:userId/photos:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

export { router as usersRouter };
