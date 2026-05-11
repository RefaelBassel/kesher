import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { id } = await params;
  const { action } = await req.json();
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be approve|reject' }, { status: 400 });
  }
  const admin = createAdminClient();
  const { data: s } = await admin.from('source_suggestions').select('*').eq('id', id).single();
  if (!s) return NextResponse.json({ error: 'not found' }, { status: 404 });

  if (action === 'approve') {
    // Insert as source (inactive — admin must confirm via test on next page).
    const { error } = await admin.from('sources').insert({
      name: s.name,
      url: s.url,
      language: 'en',
      active: false,
      created_by: guard.user.id,
    });
    if (error && !error.message.includes('duplicate')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  await admin
    .from('source_suggestions')
    .update({ status: action === 'approve' ? 'approved' : 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: guard.user.id })
    .eq('id', id);

  return NextResponse.json({ ok: true });
}
