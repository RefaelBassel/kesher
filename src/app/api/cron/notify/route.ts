import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authorizeCron } from '@/lib/cron-auth';
import { sendNewMatchEmail, sendDeadlineReminderEmail } from '@/lib/notifications/email';
import { sendPushNewMatch } from '@/lib/notifications/push';
import type { PushSubscription } from 'web-push';
import { daysUntil } from '@/lib/utils';

export const runtime = 'nodejs';
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  let sent = 0;
  let failed = 0;

  // 1) Send pending notifications
  const { data: pending } = await supabase
    .from('notifications')
    .select('*, opportunities(*), profiles(email, locale, push_subscription)')
    .is('sent_at', null)
    .limit(200);

  for (const n of pending ?? []) {
    const opp = (n as any).opportunities;
    const profile = (n as any).profiles;
    if (!opp || !profile) {
      await supabase.from('notifications').update({ sent_at: new Date().toISOString(), error: 'missing relation' }).eq('id', n.id);
      continue;
    }
    try {
      if (n.channel === 'email') {
        await sendNewMatchEmail(profile.email, opp, profile.locale ?? 'en');
      } else if (n.channel === 'push' && profile.push_subscription) {
        await sendPushNewMatch(profile.push_subscription as PushSubscription, opp, profile.locale ?? 'en');
      }
      await supabase.from('notifications').update({ sent_at: new Date().toISOString() }).eq('id', n.id);
      sent++;
    } catch (e) {
      failed++;
      await supabase
        .from('notifications')
        .update({ sent_at: new Date().toISOString(), error: (e as Error).message })
        .eq('id', n.id);
    }
  }

  // 2) Queue deadline reminders for saved opportunities at 7 and 2 days out
  const reminderWindows = [7, 2];
  for (const days of reminderWindows) {
    const target = new Date();
    target.setDate(target.getDate() + days);
    const start = new Date(target);
    start.setHours(0, 0, 0, 0);
    const end = new Date(target);
    end.setHours(23, 59, 59, 999);

    const { data: closing } = await supabase
      .from('opportunities')
      .select('id')
      .eq('status', 'active')
      .gte('deadline', start.toISOString())
      .lte('deadline', end.toISOString());

    for (const opp of closing ?? []) {
      const { data: saves } = await supabase
        .from('saved_opportunities')
        .select('profile_id, profiles(email, locale, notify_email)')
        .eq('opportunity_id', opp.id);
      for (const s of saves ?? []) {
        const profile = (s as any).profiles;
        if (!profile?.notify_email) continue;
        const { data: oppFull } = await supabase
          .from('opportunities')
          .select('*')
          .eq('id', opp.id)
          .single();
        if (!oppFull) continue;
        try {
          const dl = daysUntil(oppFull.deadline) ?? days;
          await sendDeadlineReminderEmail(profile.email, oppFull, dl, profile.locale ?? 'en');
          sent++;
        } catch (e) {
          failed++;
          console.warn('[notify] reminder failed', (e as Error).message);
        }
      }
    }
  }

  return NextResponse.json({ sent, failed, timestamp: new Date().toISOString() });
}
