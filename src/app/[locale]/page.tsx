import { setRequestLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Hero } from '@/components/hero';
import { OpportunityGrid } from '@/components/opportunity-grid';
import { CategoryCard } from '@/components/category-card';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { ALL_CATEGORIES } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const tCat = await getTranslations('categories');
  const tCatDesc = await getTranslations('categoryDescriptions');

  let closing: { data: any[] | null } = { data: [] };
  let recommended: { data: any[] | null } = { data: [] };
  let fresh: { data: any[] | null } = { data: [] };

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const now = new Date().toISOString();
    const sixWeeksLater = new Date(Date.now() + 6 * 7 * 86400_000).toISOString();
    const oneWeekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();

    try {
      [closing, recommended, fresh] = await Promise.all([
        supabase
          .from('opportunities')
          .select('*')
          .eq('status', 'active')
          .gte('deadline', now)
          .lte('deadline', sixWeeksLater)
          .order('deadline', { ascending: true })
          .limit(6),
        supabase
          .from('opportunities')
          .select('*')
          .eq('status', 'active')
          .eq('recommended', true)
          .order('discovered_at', { ascending: false })
          .limit(6),
        supabase
          .from('opportunities')
          .select('*')
          .eq('status', 'active')
          .gte('discovered_at', oneWeekAgo)
          .order('discovered_at', { ascending: false })
          .limit(6),
      ]);
    } catch (e) {
      console.warn('[home] Supabase query failed:', (e as Error).message);
    }
  }

  const setupNeeded = !isSupabaseConfigured();

  return (
    <>
      <Hero />
      <div className="container space-y-16 py-12">
        {setupNeeded && (
          <div className="rounded-lg border-2 border-dashed border-brand-sand bg-brand-cream/50 p-6 text-center">
            <p className="font-semibold text-brand-deep">
              ⚙️ Connect Supabase to start showing opportunities
            </p>
            <p className="mt-2 text-sm text-brand-deep/70">
              Fill in <code>.env.local</code> with your Supabase URL and keys, then restart the dev server.
              See README.md for the full setup guide.
            </p>
          </div>
        )}
        {!!closing.data?.length && (
          <Section title={`🔥 ${t('section_closing_soon')}`} href={`/${locale}/opportunities?sort=deadline`}>
            <OpportunityGrid items={closing.data} />
          </Section>
        )}

        {!!recommended.data?.length && (
          <Section title={`⭐ ${t('section_recommended')}`} href={`/${locale}/opportunities?recommended=1`}>
            <OpportunityGrid items={recommended.data} />
          </Section>
        )}

        {!!fresh.data?.length && (
          <Section title={`✨ ${t('section_new')}`} href={`/${locale}/opportunities?sort=newest`}>
            <OpportunityGrid items={fresh.data} />
          </Section>
        )}

        <section className="space-y-6">
          <h2 className="font-serif text-2xl font-bold tracking-tight md:text-3xl">
            {t('section_browse_categories')}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {ALL_CATEGORIES.map((cat) => (
              <CategoryCard
                key={cat}
                category={cat}
                href={`/${locale}/opportunities?category=${cat}`}
                title={tCat(cat)}
                description={tCatDesc(cat)}
              />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Button asChild variant="ghost" size="sm">
          <Link href={href}>
            View all <ArrowRight className="h-4 w-4 ltr:ml-2 rtl:mr-2 rtl:rotate-180" />
          </Link>
        </Button>
      </div>
      {children}
    </section>
  );
}
