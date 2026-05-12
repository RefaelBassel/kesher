'use client';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import { Bookmark, LogIn, LogOut, User as UserIcon, Shield, Menu } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export function Header() {
  const locale = useLocale();
  const t = useTranslations('nav');
  const [user, setUser] = useState<{ email?: string; isAdmin?: boolean } | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    // getSession() reads from cookies without a network roundtrip — much more reliable in dev.
    const loadFromSession = async (sessionUser: { id: string; email?: string } | null) => {
      if (!sessionUser) return setUser(null);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', sessionUser.id)
          .maybeSingle();
        setUser({ email: sessionUser.email, isAdmin: profile?.role === 'admin' });
      } catch {
        setUser({ email: sessionUser.email, isAdmin: false });
      }
    };
    supabase.auth.getSession().then(({ data }) => {
      loadFromSession(data.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      loadFromSession(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = `/${locale}`;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2 text-xl font-bold text-brand-deep dark:text-brand-sand"
          >
            <span className="font-serif text-3xl font-black leading-none">ק</span>
            <span className="font-serif tracking-tight">Kesher</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink href={`/${locale}`}>{t('home')}</NavLink>
            <NavLink href={`/${locale}/opportunities`}>{t('opportunities')}</NavLink>
            <NavLink href={`/${locale}/about`}>{t('about')}</NavLink>
          </nav>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/${locale}/saved`}>
                  <Bookmark className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('saved')}
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" title={user.email}>
                <Link href={`/${locale}/profile`}>
                  <UserIcon className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  <span className="hidden lg:inline">{user.email?.split('@')[0]}</span>
                  <span className="lg:hidden">{t('profile')}</span>
                </Link>
              </Button>
              {user.isAdmin && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/${locale}/admin`}>
                    <Shield className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                    {t('admin')}
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={signOut} title={t('logout')}>
                <LogOut className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('logout')}
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href={`/${locale}/login`}>
                <LogIn className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('login')}
              </Link>
            </Button>
          )}
        </div>
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="end" className="w-72">
              <div className="mt-8 flex flex-col gap-4">
                <NavLink href={`/${locale}`}>{t('home')}</NavLink>
                <NavLink href={`/${locale}/opportunities`}>{t('opportunities')}</NavLink>
                <NavLink href={`/${locale}/about`}>{t('about')}</NavLink>
                {user ? (
                  <>
                    {user.email && (
                      <p className="px-3 py-2 text-xs text-muted-foreground truncate">{user.email}</p>
                    )}
                    <NavLink href={`/${locale}/saved`}>{t('saved')}</NavLink>
                    <NavLink href={`/${locale}/profile`}>{t('profile')}</NavLink>
                    {user.isAdmin && <NavLink href={`/${locale}/admin`}>{t('admin')}</NavLink>}
                    <button
                      onClick={signOut}
                      className="rounded-md px-3 py-2 text-start text-sm font-medium text-destructive transition hover:bg-accent"
                    >
                      {t('logout')}
                    </button>
                  </>
                ) : (
                  <NavLink href={`/${locale}/login`}>{t('login')}</NavLink>
                )}
                <div className="pt-4">
                  <LanguageSwitcher />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn('rounded-md px-3 py-2 text-sm font-medium transition hover:bg-accent', className)}
    >
      {children}
    </Link>
  );
}
