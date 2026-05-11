import { createAdminClient } from '@/lib/supabase/admin';
import { SuggestionsList } from '@/components/admin/suggestions-list';

export const dynamic = 'force-dynamic';

export default async function AdminSuggestionsPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('source_suggestions')
    .select('*, sources(name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(100);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Source suggestions</h1>
      <SuggestionsList items={(data ?? []) as any} />
    </div>
  );
}
