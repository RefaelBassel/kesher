import { Suspense } from 'react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { OpportunityGrid } from '@/components/opportunity-grid';
import { FilterBar } from '@/components/filter-bar';
import type { Locale } from '@/lib/i18n/config';
import { ALL_CATEGORIES } from '@/types/domain';

export const dynamic = 'force-dynamic';

interface SearchParams {
  q?: string;
  category?: string;
  age?: string;
  language?: string;
  free?: string;
  scholarship?: string;
  recommended?: string;
  sort?: 'deadline' | 'newest' | 'alpha';
}

export default async function OpportunitiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('nav');
  const sp = await searchParams;

  const supabase = await createClient();
  let query = supabase.from('opportunities').select('*').eq('status', 'active');

  if (sp.q) {
    const safe = sp.q.replace(/[%_]/g, '\\$&');
    query = query.or(
      `title_${locale}.ilike.%${safe}%,description_${locale}.ilike.%${safe}%,title_en.ilike.%${safe}%,description_en.ilike.%${safe}%`,
    );
  }
  if (sp.category && (ALL_CATEGORIES as string[]).includes(sp.category)) {
    query = query.eq('category', sp.category);
  }
  if (sp.language) query = query.contains('languages', [sp.language]);
  if (sp.free === '1') query = query.eq('is_free', true);
  if (sp.scholarship === '1') query = query.eq('has_scholarship', true);
  if (sp.recommended === '1') query = query.eq('recommended', true);

  switch (sp.sort) {
    case 'newest':
      query = query.order('discovered_at', { ascending: false });
      break;
    case 'alpha':
      query = query.order(`title_${locale}`, { ascending: true, nullsFirst: false });
      break;
    case 'deadline':
    default:
      query = query.order('deadline', { ascending: true, nullsFirst: false });
  }

  const { data: opportunities } = await query.limit(60);

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">{t('opportunities')}</h1>
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Suspense>
            <FilterBar />
          </Suspense>
        </aside>
        <div>
          <OpportunityGrid items={opportunities ?? []} />
        </div>
      </div>
    </div>
  );
}
