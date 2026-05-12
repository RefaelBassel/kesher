'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Share, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Browser-defined event for the install banner; Chrome fires it when the PWA is installable.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY = 'kesher_install_dismissed_at';
// Don't pester users for a week after they dismiss.
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function isIos(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error iOS-only property
    window.navigator.standalone === true
  );
}

export function InstallPrompt() {
  const t = useTranslations('install');
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isStandalone()) return;

    const dismissedAt = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Date.now() - dismissedAt < COOLDOWN_MS) return;

    if (isIos()) {
      setShowIos(true);
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setVisible(false);
  }

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome !== 'dismissed') {
      setVisible(false);
    } else {
      dismiss();
    }
    setDeferred(null);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-brand-sand/40 bg-brand-cream text-brand-deep shadow-lg shadow-brand-deep/20 dark:bg-card dark:text-foreground">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-deep text-brand-sand">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="font-semibold leading-tight">{t('title')}</p>
          {showIos ? (
            <p className="text-sm leading-snug opacity-80">
              {t('ios_step1')}{' '}
              <Share className="inline h-4 w-4 align-text-bottom" /> {t('ios_step2')}{' '}
              <Plus className="inline h-4 w-4 align-text-bottom" /> {t('ios_step3')}
            </p>
          ) : (
            <p className="text-sm leading-snug opacity-80">{t('android_subtitle')}</p>
          )}
          {!showIos && (
            <div className="pt-2">
              <Button size="sm" onClick={install} className="bg-brand-deep text-brand-cream hover:bg-brand-deep/90">
                {t('install_button')}
              </Button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="rounded-md p-1 opacity-60 transition hover:bg-black/5 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
