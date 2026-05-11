import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/lib/i18n/config';

export default async function AboutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="container max-w-3xl py-16 space-y-6">
      <h1 className="text-3xl font-bold">About Kesher</h1>
      <p className="text-lg text-muted-foreground">
        Kesher (קשר — "connection") is a project of the Jewish community of Warsaw. We collect, translate,
        and recommend educational opportunities from the Jewish world — programs, scholarships, fellowships,
        seminars, heritage trips and more — and match them to your interests and background.
      </p>
      <p>
        Every day, our system visits trusted Jewish organizations, surfaces what's new, translates it into
        Hebrew, English and Polish, and notifies you if it fits your profile. Rabbi David Shichowsky and the
        Warsaw community personally vet recommendations.
      </p>
      <p>
        Free for individual users, forever. Built on open standards.
      </p>
    </div>
  );
}
