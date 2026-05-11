import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { OnboardingWizard } from '@/components/onboarding-wizard';
import { createClient } from '@/lib/supabase/server';
import type { Locale } from '@/lib/i18n/config';

export default async function OnboardingPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?redirect=/${locale}/onboarding`);

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

  return (
    <div className="container max-w-2xl py-10">
      <OnboardingWizard initial={profile ?? undefined} />
    </div>
  );
}
