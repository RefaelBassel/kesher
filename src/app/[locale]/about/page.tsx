import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Globe2, Sparkles, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CategoryCard } from '@/components/category-card';
import { ALL_CATEGORIES } from '@/types/domain';
import type { Locale } from '@/lib/i18n/config';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  const t = await getTranslations('about');
  return { title: t('page_title') };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  const t = await getTranslations('about');
  const tCat = await getTranslations('categories');
  const tCatDesc = await getTranslations('categoryDescriptions');

  // Helper to render translations with inline <signup>/<profile>/<opps> hyperlinks.
  // The translation strings contain placeholders like "<signup>text</signup>",
  // and we map each tag to a real Next <Link> here.
  const linkClass =
    'inline-flex items-center gap-1 font-semibold text-brand-deep underline decoration-brand-sand decoration-2 underline-offset-4 transition hover:decoration-brand-deep dark:text-brand-sand dark:decoration-brand-sand/60';

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-deep via-[#1f4870] to-brand-forest text-brand-cream">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 30%, rgba(212,165,116,0.4), transparent 50%), radial-gradient(circle at 85% 70%, rgba(196,57,47,0.25), transparent 60%)',
          }}
        />
        <div className="container relative z-10 max-w-4xl py-20 text-center md:py-28">
          <h1 className="font-serif text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl">
            {t('title')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-cream/85 md:text-xl">
            {t('subtitle')}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-brand-sand text-brand-deep hover:bg-brand-sand/90 shadow-lg shadow-brand-sand/30"
            >
              <Link href={`/${locale}/signup`}>
                {t('cta_primary')}
                <ArrowRight className="h-5 w-5 ltr:ml-2 rtl:mr-2 rtl:rotate-180" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="text-brand-cream hover:bg-white/10 hover:text-brand-cream">
              <Link href={`/${locale}/login`}>{t('cta_secondary')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container max-w-5xl space-y-20 py-16">
        {/* Why Kesher */}
        <section className="space-y-8">
          <h2 className="text-center font-serif text-3xl font-bold tracking-tight md:text-4xl">
            {t('why_title')}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <WhyCard icon={<Globe2 className="h-6 w-6" />} title={t('why1_title')} body={t('why1_body')} />
            <WhyCard icon={<Sparkles className="h-6 w-6" />} title={t('why2_title')} body={t('why2_body')} />
            <WhyCard icon={<BellRing className="h-6 w-6" />} title={t('why3_title')} body={t('why3_body')} />
          </div>
        </section>

        {/* How it works */}
        <section className="space-y-8">
          <h2 className="text-center font-serif text-3xl font-bold tracking-tight md:text-4xl">
            {t('how_title')}
          </h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {([1, 2, 3] as const).map((n) => (
              <li key={n} className="relative">
                <Card className="h-full p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-deep font-serif text-lg font-bold text-brand-sand">
                    {n}
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t(`how_step${n}_label` as 'how_step1_label')}
                  </p>
                  <p className="mt-2 leading-relaxed">
                    {t.rich(`how_step${n}` as 'how_step1', {
                      signup: (chunks) => (
                        <Link href={`/${locale}/signup`} className={linkClass}>
                          {chunks}
                        </Link>
                      ),
                      profile: (chunks) => (
                        <Link href={`/${locale}/onboarding`} className={linkClass}>
                          {chunks}
                        </Link>
                      ),
                      opps: (chunks) => (
                        <Link href={`/${locale}/opportunities`} className={linkClass}>
                          {chunks}
                        </Link>
                      ),
                    })}
                  </p>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        {/* What you'll find */}
        <section className="space-y-6">
          <h2 className="text-center font-serif text-3xl font-bold tracking-tight md:text-4xl">
            {t('what_title')}
          </h2>
          <p className="mx-auto max-w-2xl text-center text-muted-foreground">{t('what_intro')}</p>
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

        {/* Final CTA */}
        <section>
          <Card className="overflow-hidden border-brand-sand/40 bg-gradient-to-br from-brand-cream to-brand-cream/60 p-10 text-center dark:from-card dark:to-card/80">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-brand-deep md:text-4xl dark:text-brand-sand">
              {t('cta_section_title')}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t('cta_section_body')}</p>
            <div className="mt-6">
              <Button asChild size="lg">
                <Link href={`/${locale}/signup`}>
                  {t('cta_primary')}
                  <ArrowRight className="h-5 w-5 ltr:ml-2 rtl:mr-2 rtl:rotate-180" />
                </Link>
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}

function WhyCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="h-full p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-deep text-brand-sand">
        {icon}
      </div>
      <h3 className="mt-4 font-serif text-xl font-bold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </Card>
  );
}
