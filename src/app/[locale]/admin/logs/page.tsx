import { createAdminClient } from '@/lib/supabase/admin';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function AdminLogsPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('scrape_logs')
    .select('*, sources(name)')
    .order('started_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Scrape logs</h1>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-3 py-2">Started</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Result</th>
              <th className="px-3 py-2 text-right">Tokens</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((l: any) => (
              <tr key={l.id} className="border-t">
                <td className="px-3 py-2 align-top text-xs text-muted-foreground">
                  {new Date(l.started_at).toLocaleString()}
                </td>
                <td className="px-3 py-2 align-top">{l.sources?.name ?? '—'}</td>
                <td className="px-3 py-2 align-top">
                  {l.error ? (
                    <span className="text-destructive text-xs">{l.error}</span>
                  ) : (
                    <span className="text-xs">
                      <Badge variant="success" className="mr-2">{l.new_count ?? 0} new</Badge>
                      <Badge variant="muted">{l.updated_count ?? 0} updated</Badge>
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 align-top text-right text-xs text-muted-foreground">{l.tokens_used ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
