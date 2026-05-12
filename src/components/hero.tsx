'use client';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function Hero() {
  const t = useTranslations('home');
  const locale = useLocale();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-deep via-[#1f4870] to-brand-forest text-brand-cream">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(212,165,116,0.4), transparent 50%), radial-gradient(circle at 80% 70%, rgba(196,57,47,0.3), transparent 60%)',
        }}
      />
      <div className="container relative z-10 flex flex-col items-start gap-6 py-20 md:py-28">
        <div className="space-y-4 max-w-2xl">
          <h1 className="font-serif text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            {t('hero_title')}
          </h1>
          <p className="text-lg text-brand-cream/85 md:text-xl">{t('hero_subtitle')}</p>
        </div>
        <Button
          asChild
          size="lg"
          className="bg-brand-sand text-brand-deep hover:bg-brand-sand/90 shadow-lg shadow-brand-sand/30"
        >
          <Link href={`/${locale}/opportunities`}>
            {t('hero_cta')}
            <ArrowRight className="h-5 w-5 ltr:ml-2 rtl:mr-2 rtl:rotate-180" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
