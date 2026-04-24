import { createClient } from 'npm:@supabase/supabase-js@2';

export function getServiceClient() {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseSecretKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    return createClient(supabaseUrl, supabaseSecretKey, { auth: { persistSession: false } });
}

/**
 * Creates a client scoped to the authenticated user's JWT.
 * This sets auth.uid() so RLS policies (user_id = auth.uid()) are satisfied.
 */
function getUserClient(token: string) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
    }
  
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
  }