'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Opportunity } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

type Row = Opportunity & { sources?: { name: string } | null };

export function OpportunitiesAdminTable({ items }: { items: Row[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleRecommended(o: Row, v: boolean) {
    setBusyId(o.id);
    await fetch(`/api/admin/opportunities/${o.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ recommended: v }),
    });
    setBusyId(null);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm('Delete this opportunity?')) return;
    setBusyId(id);
    await fetch(`/api/admin/opportunities/${id}`, { method: 'DELETE' });
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2">Source</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Deadline</th>
            <th className="px-3 py-2">Recommended</th>
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((o) => (
            <tr key={o.id} className="border-t">
              <td className="px-3 py-2 align-top max-w-md">
                <p className="line-clamp-1 font-medium">{o.title_en ?? o.title_he ?? o.title_pl}</p>
              </td>
              <td className="px-3 py-2 align-top">{o.sources?.name ?? '—'}</td>
              <td className="px-3 py-2 align-top"><Badge variant="muted">{o.status}</Badge></td>
              <td className="px-3 py-2 align-top text-xs text-muted-foreground">
                {o.deadline ? new Date(o.deadline).toLocaleDateString() : '—'}
              </td>
              <td className="px-3 py-2 align-top">
                <Switch checked={o.recommended} onCheckedChange={(v) => toggleRecommended(o, v)} disabled={busyId === o.id} />
              </td>
              <td className="px-3 py-2 align-top text-right">
                <div className="flex justify-end gap-2">
                  <RecommendedNoteEditor o={o} onSaved={() => router.refresh()} />
                  <Button size="sm" variant="destructive" onClick={() => remove(o.id)} disabled={busyId === o.id}>×</Button>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No opportunities</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function RecommendedNoteEditor({ o, onSaved }: { o: Row; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(o.recommended_note ?? '');
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await fetch(`/api/admin/opportunities/${o.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ recommended_note: note, recommended: true }),
    });
    setBusy(false);
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline">Note</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Recommended note</DialogTitle></DialogHeader>
        <Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why does the Warsaw community recommend this?" />
        <DialogFooter><Button onClick={save} disabled={busy}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
