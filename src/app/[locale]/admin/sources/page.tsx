import { createAdminClient } from '@/lib/supabase/admin';
import { SourcesTable } from '@/components/admin/sources-table';
import { AddSourceDialog } from '@/components/admin/add-source-dialog';

export const dynamic = 'force-dynamic';

export default async function AdminSourcesPage() {
  const supabase = createAdminClient();
  const { data: sources } = await supabase.from('sources').select('*').order('created_at', { ascending: false });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sources</h1>
        <AddSourceDialog />
      </div>
      <SourcesTable sources={sources ?? []} />
    </div>
  );
}
