import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { id } = await params;
  const body = await req.json();
  const allowed = [
    'status',
    'recommended',
    'recommended_note',
    'category',
    'age_min',
    'age_max',
    'cost_amount',
    'cost_currency',
    'is_free',
    'has_scholarship',
    'deadline',
    'start_date',
    'end_date',
    'location',
    'duration_text',
    'title_he', 'title_en', 'title_pl',
    'description_he', 'description_en', 'description_pl',
    'short_summary_he', 'short_summary_en', 'short_summary_pl',
  ];
  const update: Record<string, any> = {};
  for (const k of allowed) if (k in body) update[k] = body[k];
  const admin = createAdminClient();
  const { error } = await admin.from('opportunities').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from('opportunities').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
