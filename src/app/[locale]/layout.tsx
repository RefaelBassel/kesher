import '@/app/globals.css';
import type { Metadata } from 'next';
import { Inter, Heebo, Playfair_Display } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Providers } from '@/app/providers';
import { SwRegister } from '@/components/sw-register';
import { InstallPrompt } from '@/components/install-prompt';
import { locales, getDirection, type Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '700', '800', '900'],
  variable: '--font-serif',
  display: 'swap',
});

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '500', '700', '800', '900'],
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
  // iOS-specific meta so the app installs cleanly to home screen with the right title and look.
  appleWebApp: {
    capable: true,
    title: 'Kesher',
    statusBarStyle: 'black-translucent',
    startupImage: ['/icons/icon-512.png'],
  },
  // Critical for iOS PWA push notifications (iOS 16.4+) — the icon shown on the home screen.
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Kesher',
    description: 'Educational opportunities for the Warsaw Jewish community',
    type: 'website',
    images: ['/icons/icon-512.png'],
  },
};

export const viewport = {
  themeColor: '#1e3a5f',
  width: 'device-width',
  initialScale: 1,
  // Allow zooming on iOS for accessibility — important for elderly community members.
  maximumScale: 5,
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
    <html lang={locale} dir={dir} className={cn(inter.variable, playfair.variable, heebo.variable)} suppressHydrationWarning>
      <body className={locale === 'he' ? 'font-heebo' : 'font-sans'}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>
            <Header />
            <main className="min-h-[calc(100vh-4rem)]">{children}</main>
            <Footer />
            <SwRegister />
            <InstallPrompt />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
