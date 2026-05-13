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
  const currentYear = new Date().getFullYear();

  // 1. Mark passed-deadline opportunities as expired (7-day grace).
  const expiredRes = await supabase
    .from('opportunities')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('deadline', sevenDaysAgo)
    .select('id');

  // 2. Catch opportunities the AI mistakenly extracted as current but that mention a past year
  //    in the title (e.g. "Szarvas Summer 2017"). Done in JS — clearer than crafting regex
  //    for Supabase's .or() filter syntax, and we only scan a few hundred active rows.
  const { data: active } = await supabase
    .from('opportunities')
    .select('id, title_en, title_he, title_pl')
    .eq('status', 'active');

  const yearRegex = /\b(19\d{2}|20\d{2})\b/g;
  const pastEventIds = (active ?? [])
    .filter((o) => {
      const text = [o.title_en, o.title_he, o.title_pl].filter(Boolean).join(' ');
      const years = [...text.matchAll(yearRegex)].map((m) => parseInt(m[1]!, 10));
      // Mark as past only when ALL mentioned years are strictly past — avoids touching
      // titles like "Summer 2017 vs Summer 2027" where one year is still upcoming.
      if (years.length === 0) return false;
      return years.every((y) => y < currentYear);
    })
    .map((o) => o.id);

  if (pastEventIds.length > 0) {
    await supabase.from('opportunities').update({ status: 'expired' }).in('id', pastEventIds);
  }

  // 3. Trim old scrape logs (keep 90 days).
  const deletedRes = await supabase
    .from('scrape_logs')
    .delete()
    .lt('started_at', ninetyDaysAgo)
    .select('id');

  return NextResponse.json({
    expired: expiredRes.data?.length ?? 0,
    pastEvents: pastEventIds.length,
    deletedLogs: deletedRes.data?.length ?? 0,
    timestamp: new Date().toISOString(),
  });
}
