import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { extractFromUrl } from '@/lib/scraper/extract';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Run extraction once and return the preview WITHOUT writing opportunities to the DB.
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { id } = await params;
  const admin = createAdminClient();
  const { data: source } = await admin.from('sources').select('*').eq('id', id).single();
  if (!source) return NextResponse.json({ error: 'source not found' }, { status: 404 });
  try {
    const { result } = await extractFromUrl(source.name, source.url, source.scrape_type === 'playwright');
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
