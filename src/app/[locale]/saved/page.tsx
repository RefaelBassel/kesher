import { redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { OpportunityGrid } from '@/components/opportunity-grid';
import type { Locale } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

export default async function SavedPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('saved');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?redirect=/${locale}/saved`);

  const { data } = await supabase
    .from('saved_opportunities')
    .select('opportunity_id, saved_at, opportunities(*)')
    .eq('profile_id', user.id)
    .order('saved_at', { ascending: false });

  const items = (data ?? [])
    .map((r: any) => r.opportunities)
    .filter(Boolean);

  return (
    <div className="container py-10 space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      {items.length === 0 ? <p className="text-muted-foreground">{t('empty')}</p> : <OpportunityGrid items={items} />}
    </div>
  );
}
