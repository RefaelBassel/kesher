import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { translateAll, spreadTranslations } from '@/lib/scraper/translate';

export const runtime = 'nodejs';
export const maxDuration = 300;

// Re-runs translation for opportunities that have title_en but are missing title_he or title_pl.
// Useful after a scrape where Gemini hit a rate limit and dropped the translation step.
export async function POST() {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from('opportunities')
    .select('id, title_en, description_en, title_he, title_pl')
    .or('title_he.is.null,title_pl.is.null')
    .not('title_en', 'is', null)
    .limit(50);

  if (!rows || rows.length === 0) {
    return NextResponse.json({ message: 'Nothing to translate', updated: 0 });
  }

  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const t = await translateAll(row.title_en as string, (row.description_en as string) ?? '');
      const spread = spreadTranslations(t.translations);
      await admin.from('opportunities').update(spread).eq('id', row.id);
      updated++;
    } catch (e) {
      failed++;
      errors.push(`${row.id}: ${(e as Error).message}`);
      // Small backoff if we keep failing — likely Gemini rate limit.
      await new Promise((r) => setTimeout(r, 2_000));
    }
    // Friendly pace so we don't blow through the free quota.
    await new Promise((r) => setTimeout(r, 800));
  }

  return NextResponse.json({ found: rows.length, updated, failed, errors: errors.slice(0, 5) });
}
