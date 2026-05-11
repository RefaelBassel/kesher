import { createAdminClient } from '@/lib/supabase/admin';
import { extractFromUrl } from './extract';
import { spreadTranslations, translateAll } from './translate';
import { hashOpportunity } from '@/lib/utils';
import type { Source, OpportunityInsert } from '@/types/domain';
import { queueNotificationsForOpportunity } from '@/lib/notifications/matcher';

export interface ScrapeOutcome {
  sourceId: string;
  newCount: number;
  updatedCount: number;
  totalFound: number;
  tokensUsed: number;
  provider?: 'gemini' | 'groq';
  error?: string;
}

export async function scrapeSource(sourceId: string): Promise<ScrapeOutcome> {
  const supabase = createAdminClient();

  const { data: source, error: srcErr } = await supabase
    .from('sources')
    .select('*')
    .eq('id', sourceId)
    .single();
  if (srcErr || !source) throw new Error(`Source not found: ${sourceId}`);

  const { data: log } = await supabase
    .from('scrape_logs')
    .insert({ source_id: sourceId, started_at: new Date().toISOString() })
    .select()
    .single();

  let totalTokens = 0;
  let provider: 'gemini' | 'groq' | undefined;

  try {
    const useDynamic = source.scrape_type === 'playwright';
    const { result: extracted, tokensUsed, provider: extractProvider } = await extractFromUrl(
      source.name,
      source.url,
      useDynamic,
    );
    totalTokens += tokensUsed;
    provider = extractProvider;

    let newCount = 0;
    let updatedCount = 0;

    for (const opp of extracted.opportunities) {
      const externalId = hashOpportunity(opp.url, opp.title);

      // Translate to all 3 languages in a single AI call.
      let translations;
      try {
        const t = await translateAll(opp.title, opp.description);
        totalTokens += t.tokensUsed;
        translations = spreadTranslations(t.translations);
      } catch (e) {
        console.warn('[scraper] translation failed, falling back to original-only', (e as Error).message);
        translations = {
          title_en: opp.title,
          title_he: null,
          title_pl: null,
          description_en: opp.description,
          description_he: null,
          description_pl: null,
          short_summary_en: opp.description.slice(0, 120),
          short_summary_he: null,
          short_summary_pl: null,
        };
      }

      const record: OpportunityInsert = {
        source_id: source.id,
        external_id: externalId,
        url: opp.url,
        ...translations,
        image_url: opp.image_url,
        category: opp.category as any,
        age_min: opp.age_min,
        age_max: opp.age_max,
        languages: opp.languages,
        cost_amount: opp.cost_amount,
        cost_currency: opp.cost_currency ?? 'USD',
        is_free: opp.is_free,
        has_scholarship: opp.has_scholarship,
        deadline: opp.deadline,
        start_date: opp.start_date,
        end_date: opp.end_date,
        location: opp.location,
        duration_text: opp.duration_text,
        status: 'active',
        raw_extracted: opp as any,
      };

      const { data: existing } = await supabase
        .from('opportunities')
        .select('id')
        .eq('source_id', source.id)
        .eq('external_id', externalId)
        .maybeSingle();

      if (existing) {
        await supabase.from('opportunities').update(record).eq('id', existing.id);
        updatedCount++;
      } else {
        const { data: inserted } = await supabase
          .from('opportunities')
          .insert(record)
          .select('id')
          .single();
        newCount++;
        if (inserted) {
          // Fire-and-forget; matcher logs its own errors.
          await queueNotificationsForOpportunity(inserted.id).catch((err) =>
            console.warn('[matcher] queue failed', err.message),
          );
        }
      }
    }

    // Save mentioned organizations as suggestions for admin review.
    for (const m of extracted.mentioned_organizations) {
      await supabase
        .from('source_suggestions')
        .upsert(
          {
            name: m.name,
            url: m.url,
            context: m.context ?? null,
            mentioned_in_source_id: source.id,
          },
          { onConflict: 'url', ignoreDuplicates: true },
        );
    }

    if (log) {
      await supabase
        .from('scrape_logs')
        .update({
          completed_at: new Date().toISOString(),
          new_count: newCount,
          updated_count: updatedCount,
          total_found: extracted.opportunities.length,
          tokens_used: totalTokens,
          provider,
        })
        .eq('id', log.id);
    }

    await supabase
      .from('sources')
      .update({
        last_scraped_at: new Date().toISOString(),
        last_success_at: new Date().toISOString(),
        consecutive_failures: 0,
        last_error: null,
      })
      .eq('id', source.id);

    return {
      sourceId,
      newCount,
      updatedCount,
      totalFound: extracted.opportunities.length,
      tokensUsed: totalTokens,
      provider,
    };
  } catch (e) {
    const error = (e as Error).message;
    if (log) {
      await supabase
        .from('scrape_logs')
        .update({ completed_at: new Date().toISOString(), error, tokens_used: totalTokens, provider })
        .eq('id', log.id);
    }
    await supabase.rpc('increment_source_failures', { p_source_id: sourceId, p_error: error });
    return { sourceId, newCount: 0, updatedCount: 0, totalFound: 0, tokensUsed: totalTokens, error };
  }
}

export async function getDueSources(limit = 20): Promise<Source[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('sources')
    .select('*')
    .eq('active', true)
    .order('last_scraped_at', { ascending: true, nullsFirst: true })
    .limit(limit);
  const now = Date.now();
  return (data ?? []).filter((s) => {
    if (!s.last_scraped_at) return true;
    const ageHours = (now - new Date(s.last_scraped_at).getTime()) / 36e5;
    return ageHours >= s.check_frequency_hours;
  });
}
