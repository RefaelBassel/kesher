import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { LoginForm } from '@/components/auth/login-form';
import type { Locale } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="container max-w-md py-16">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
