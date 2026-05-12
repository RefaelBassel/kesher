'use client';
import { useEffect } from 'react';

// Registers the service worker on every page load so the app is installable
// and ready to receive push notifications. Browsers cache the registration,
// so this is effectively a no-op after the first visit.
export function SwRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[sw] register failed', err);
    });
  }, []);
  return null;
}
