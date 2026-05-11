import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { name, url, description, language } = await req.json();
  if (!name || !url) return NextResponse.json({ error: 'name and url required' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('sources')
    .insert({
      name,
      url,
      description: description ?? null,
      language: language ?? 'en',
      created_by: guard.user.id,
      // Newly added sources stay disabled until the admin confirms the test result.
      active: false,
    })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id });
}

export async function GET() {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const admin = createAdminClient();
  const { data } = await admin.from('sources').select('*').order('created_at', { ascending: false });
  return NextResponse.json({ sources: data ?? [] });
}
