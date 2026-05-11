import webpush, { type PushSubscription } from 'web-push';
import type { Locale } from '@/types/database';
import type { Opportunity } from '@/types/domain';
import { localized } from '@/types/domain';

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@kesher.app';
  if (!pub || !priv) throw new Error('VAPID keys not configured');
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
}

export async function sendPushNewMatch(
  subscription: PushSubscription,
  opp: Opportunity,
  locale: Locale,
) {
  ensureConfigured();
  const title = localized(opp, 'title', locale);
  const body = localized(opp, 'short_summary', locale) || localized(opp, 'description', locale).slice(0, 120);
  const payload = JSON.stringify({
    title,
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: `/${locale}/opportunities/${opp.id}` },
  });
  await webpush.sendNotification(subscription, payload);
}
