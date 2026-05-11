import { createAdminClient } from '@/lib/supabase/admin';
import { Card } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const t = await getTranslations('admin');
  const supabase = createAdminClient();
  const { data, count } = await supabase.from('profiles').select('age_range, locale, languages, created_at', { count: 'exact' });
  const profiles = data ?? [];

  const byAge: Record<string, number> = {};
  const byLang: Record<string, number> = {};
  for (const p of profiles) {
    if (p.age_range) byAge[p.age_range] = (byAge[p.age_range] ?? 0) + 1;
    if (p.locale) byLang[p.locale] = (byLang[p.locale] ?? 0) + 1;
  }

  const last30 = profiles.filter((p) => new Date(p.created_at!).getTime() > Date.now() - 30 * 86400_000).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('users')}</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="p-4"><p className="text-sm text-muted-foreground">{t('users_total')}</p><p className="text-3xl font-bold">{count ?? 0}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted-foreground">Last 30 days</p><p className="text-3xl font-bold">{last30}</p></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-2 font-semibold">{t('users_by_age')}</h2>
          <ul className="space-y-1 text-sm">
            {Object.entries(byAge).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => (
              <li key={k} className="flex justify-between"><span>{k}</span><span>{v}</span></li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <h2 className="mb-2 font-semibold">{t('users_by_lang')}</h2>
          <ul className="space-y-1 text-sm">
            {Object.entries(byLang).map(([k, v]) => (
              <li key={k} className="flex justify-between"><span>{k}</span><span>{v}</span></li>
            ))}
          </ul>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">Personal data (emails, names) is intentionally hidden from this dashboard.</p>
    </div>
  );
}
