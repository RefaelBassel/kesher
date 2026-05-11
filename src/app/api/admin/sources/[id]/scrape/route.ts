import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { scrapeSource } from '@/lib/scraper';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { id } = await params;
  // Make sure the source is active before scraping.
  const admin = createAdminClient();
  await admin.from('sources').update({ active: true }).eq('id', id);
  try {
    const outcome = await scrapeSource(id);
    return NextResponse.json(outcome);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
