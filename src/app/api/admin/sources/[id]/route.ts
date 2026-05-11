import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { id } = await params;
  const body = await req.json();
  const allowed = ['name', 'url', 'description', 'language', 'active', 'check_frequency_hours', 'scrape_type'];
  const update: Record<string, any> = {};
  for (const k of allowed) if (k in body) update[k] = body[k];
  const admin = createAdminClient();
  const { error } = await admin.from('sources').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from('sources').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
