import { createClient } from '@supabase/supabase-js';

// Service-role client for server-side jobs (cron, admin actions). Never expose to browser.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env not configured (URL or service role key missing)');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
