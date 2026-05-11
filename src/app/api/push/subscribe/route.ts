import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const subscription = await req.json();
  await supabase
    .from('profiles')
    .update({ push_subscription: subscription, notify_push: true })
    .eq('id', user.id);
  return NextResponse.json({ ok: true });
}
