import { redirect } from 'next/navigation';
import Link from 'next/link';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import type { Locale } from '@/lib/i18n/config';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?redirect=/${locale}/admin`);
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') redirect(`/${locale}`);

  const items = [
    { href: `/${locale}/admin`, label: t('dashboard') },
    { href: `/${locale}/admin/sources`, label: t('sources') },
    { href: `/${locale}/admin/opportunities`, label: t('opportunities') },
    { href: `/${locale}/admin/suggestions`, label: t('suggestions') },
    { href: `/${locale}/admin/users`, label: t('users') },
    { href: `/${locale}/admin/logs`, label: t('logs') },
  ];

  return (
    <div className="container grid gap-8 py-8 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <nav className="flex flex-col gap-1 rounded-lg border bg-card p-3">
          {items.map((it) => (
            <Link key={it.href} href={it.href} className="rounded-md px-3 py-2 text-sm transition hover:bg-muted">
              {it.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
