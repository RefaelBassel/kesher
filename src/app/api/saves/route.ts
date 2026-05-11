import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function POST(req: Request) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { opportunityId } = await req.json();
  if (!opportunityId) return NextResponse.json({ error: 'opportunityId required' }, { status: 400 });
  const { error } = await supabase
    .from('saved_opportunities')
    .upsert({ profile_id: user.id, opportunity_id: opportunityId });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { opportunityId } = await req.json();
  if (!opportunityId) return NextResponse.json({ error: 'opportunityId required' }, { status: 400 });
  const { error } = await supabase
    .from('saved_opportunities')
    .delete()
    .eq('profile_id', user.id)
    .eq('opportunity_id', opportunityId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
