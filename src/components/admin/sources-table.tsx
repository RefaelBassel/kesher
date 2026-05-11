'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Source } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

export function SourcesTable({ sources }: { sources: Source[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function scrapeNow(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/sources/${id}/scrape`, { method: 'POST' });
    setBusyId(null);
    router.refresh();
  }

  async function toggle(id: string, active: boolean) {
    setBusyId(id);
    await fetch(`/api/admin/sources/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ active }),
    });
    setBusyId(null);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm('Delete this source and all its opportunities?')) return;
    setBusyId(id);
    await fetch(`/api/admin/sources/${id}`, { method: 'DELETE' });
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-3 py-2">Name / URL</th>
            <th className="px-3 py-2">Lang</th>
            <th className="px-3 py-2">Last scraped</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="px-3 py-2 align-top">
                <p className="font-medium">{s.name}</p>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:underline">{s.url}</a>
                {s.last_error && <p className="mt-1 text-xs text-destructive">{s.last_error}</p>}
              </td>
              <td className="px-3 py-2 align-top">{s.language}</td>
              <td className="px-3 py-2 align-top text-xs text-muted-foreground">
                {s.last_scraped_at ? new Date(s.last_scraped_at).toLocaleString() : '—'}
              </td>
              <td className="px-3 py-2 align-top">
                {s.consecutive_failures >= 3 ? (
                  <Badge variant="outline" className="border-destructive text-destructive">failing ({s.consecutive_failures})</Badge>
                ) : s.active ? (
                  <Badge variant="success">active</Badge>
                ) : (
                  <Badge variant="muted">disabled</Badge>
                )}
              </td>
              <td className="px-3 py-2 align-top">
                <div className="flex items-center justify-end gap-2">
                  <Switch checked={s.active} onCheckedChange={(v) => toggle(s.id, v)} disabled={busyId === s.id} />
                  <Button size="sm" variant="outline" onClick={() => scrapeNow(s.id)} disabled={busyId === s.id}>Scrape</Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(s.id)} disabled={busyId === s.id}>×</Button>
                </div>
              </td>
            </tr>
          ))}
          {sources.length === 0 && (
            <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No sources yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
