import { createAdminClient } from '@/lib/supabase/admin';
import { OpportunitiesAdminTable } from '@/components/admin/opportunities-admin-table';

export const dynamic = 'force-dynamic';

export default async function AdminOpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = createAdminClient();
  let q = supabase.from('opportunities').select('*, sources(name)').order('discovered_at', { ascending: false }).limit(100);
  if (status) q = q.eq('status', status as any);
  const { data } = await q;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Opportunities</h1>
      <OpportunitiesAdminTable items={(data ?? []) as any} />
    </div>
  );
}
