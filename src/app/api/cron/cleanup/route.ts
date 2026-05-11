import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authorizeCron } from '@/lib/cron-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400_000).toISOString();

  // Mark passed-deadline opportunities as expired (7-day grace).
  const expiredRes = await supabase
    .from('opportunities')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('deadline', sevenDaysAgo)
    .select('id');

  // Trim old scrape logs.
  const deletedRes = await supabase
    .from('scrape_logs')
    .delete()
    .lt('started_at', ninetyDaysAgo)
    .select('id');

  return NextResponse.json({
    expired: expiredRes.data?.length ?? 0,
    deletedLogs: deletedRes.data?.length ?? 0,
  });
}
