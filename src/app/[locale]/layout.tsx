import '@/app/globals.css';
import type { Metadata } from 'next';
import { Inter, Heebo, Fraunces } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Providers } from '@/app/providers';
import { locales, getDirection, type Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://kesher.vercel.app'),
  title: {
    default: 'Kesher — Educational opportunities for Warsaw Jewish community',
    template: '%s · Kesher',
  },
  description:
    'Discover Jewish programs, scholarships, fellowships and trips — curated for the Warsaw Jewish community.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Kesher', statusBarStyle: 'default' },
  openGraph: {
    title: 'Kesher',
    description: 'Educational opportunities for the Warsaw Jewish community',
    type: 'website',
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = getDirection(locale);

  return (
    <html lang={locale} dir={dir} className={cn(inter.variable, fraunces.variable, heebo.variable)} suppressHydrationWarning>
      <body className={locale === 'he' ? 'font-heebo' : 'font-sans'}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>
            <Header />
            <main className="min-h-[calc(100vh-4rem)]">{children}</main>
            <Footer />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
