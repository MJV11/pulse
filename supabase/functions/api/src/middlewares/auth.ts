// @deno-types="npm:@types/express@^4.17"
import { Request, Response, NextFunction } from 'npm:express@4.18.2';
import { createClient } from 'npm:@supabase/supabase-js@2';

/**
 * Validates the Bearer token in the Authorization header using Supabase Auth.
 * Attaches the authenticated user to `req.user` on success.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: { message: 'Missing or invalid Authorization header' } });
    return;
  }

  const token = authHeader.slice(7);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
    res.status(500).json({ error: { message: 'Server misconfiguration' } });
    return;
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await client.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: { message: 'Unauthorized' } });
    return;
  }

  // Attach user to request for downstream handlers
  (req as Request & { user: typeof data.user }).user = data.user;

  next();
}
