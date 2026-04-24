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
 * Accepted body fields: user_name, bio, sports, avatar_url
 */
router.put('/me', requireAuth, async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;

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
