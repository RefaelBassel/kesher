import { redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { rankForProfile } from '@/lib/notifications/matcher';
import { OpportunityGrid } from '@/components/opportunity-grid';
import type { Locale } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

export default async function OnboardingDone({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('onboarding');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const picks = await rankForProfile(user.id, 5);

  return (
    <div className="container max-w-5xl py-10 space-y-6">
      <h1 className="text-2xl font-bold">{t('your_picks')}</h1>
      <OpportunityGrid items={picks} />
    </div>
  );
}
