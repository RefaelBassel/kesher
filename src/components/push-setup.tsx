'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return view as Uint8Array<ArrayBuffer>;
}

export function PushSetup() {
  const t = useTranslations('profile');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function enable() {
    setBusy(true);
    setStatus(null);
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setStatus('Push not supported in this browser');
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setStatus('Permission denied');
        return;
      }
      const reg = await navigator.serviceWorker.register('/sw.js');
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(sub),
      });
      if (res.ok) setStatus(t('push_enabled'));
      else setStatus('Failed to register on server');
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={enable} disabled={busy} variant="outline">
        {t('enable_push')}
      </Button>
      {status && <p className="text-sm text-muted-foreground">{status}</p>}
    </div>
  );
}
