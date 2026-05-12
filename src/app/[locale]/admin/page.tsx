import { getTranslations } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { TranslateMissingButton } from '@/components/admin/translate-missing-button';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const t = await getTranslations('admin');
  const supabase = createAdminClient();

  const oneWeekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const [usersC, oppsC, scrapesC, pendingC, failingSources, missingTranslations] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase
      .from('scrape_logs')
      .select('*', { count: 'exact', head: true })
      .gte('started_at', oneWeekAgo),
    supabase.from('source_suggestions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('sources').select('*').gte('consecutive_failures', 3).order('consecutive_failures', { ascending: false }),
    supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .or('title_he.is.null,title_pl.is.null')
      .not('title_en', 'is', null),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">{t('dashboard')}</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label={t('stats_users')} value={usersC.count ?? 0} />
        <Stat label={t('stats_active_opps')} value={oppsC.count ?? 0} />
        <Stat label={t('stats_scrapes_week')} value={scrapesC.count ?? 0} />
        <Stat label={t('stats_pending_suggestions')} value={pendingC.count ?? 0} />
      </div>

      {(missingTranslations.count ?? 0) > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-brand-sand bg-brand-cream/50 p-4">
          <div>
            <p className="font-medium">
              {missingTranslations.count} opportunities are missing Hebrew/Polish translations
            </p>
            <p className="text-sm text-muted-foreground">
              Run them through Gemini translation now (free, takes ~1 second per opportunity)
            </p>
          </div>
          <TranslateMissingButton />
        </Card>
      )}

      {!!failingSources.data?.length && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t('warnings_failing_sources')}
          </h2>
          <div className="space-y-2">
            {failingSources.data.map((s) => (
              <Card key={s.id} className="flex items-center justify-between p-3 text-sm">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-muted-foreground">{s.url}</p>
                  {s.last_error && <p className="mt-1 text-xs text-destructive">{s.last_error}</p>}
                </div>
                <Badge variant="muted">{s.consecutive_failures} failures</Badge>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value.toLocaleString()}</p>
    </Card>
  );
}
