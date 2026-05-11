import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ProfileForm } from '@/components/profile-form';
import type { Locale } from '@/lib/i18n/config';

export default async function ProfilePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?redirect=/${locale}/profile`);
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return (
    <div className="container max-w-2xl py-10">
      <ProfileForm profile={profile} />
    </div>
  );
}
