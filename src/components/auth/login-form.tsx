'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm({ mode = 'signin' as 'signin' | 'signup' }) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const sp = useSearchParams();
  const redirectTo = sp.get('redirect') ?? `/${locale}`;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/${locale}/callback` },
      });
      if (error) setError(error.message);
      else {
        // If confirmations off, user is signed in immediately → onboarding.
        const { data: { session } } = await supabase.auth.getSession();
        if (session) window.location.href = `/${locale}/onboarding`;
        else setInfo(t('check_email'));
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(t('invalid_credentials'));
      else window.location.href = redirectTo;
    }
    setBusy(false);
  }

  async function withGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/${locale}/callback?next=${encodeURIComponent(redirectTo)}` },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'signup' ? t('sign_up_title') : t('sign_in_title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {info && <p className="text-sm text-muted-foreground">{info}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {mode === 'signup' ? t('sign_up_button') : t('sign_in_button')}
          </Button>
          <div className="relative my-2 text-center text-xs text-muted-foreground">
            <span className="bg-card px-2">{t('or_continue_with')}</span>
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={withGoogle}>
            {t('google')}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {mode === 'signup' ? t('have_account') : t('no_account')}{' '}
            <Link
              href={`/${locale}/${mode === 'signup' ? 'login' : 'signup'}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              {mode === 'signup' ? t('sign_in_button') : t('sign_up_button')}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
