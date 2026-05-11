'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import type { ExtractedOpportunity } from '@/lib/scraper/prompts';

export function AddSourceDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('en');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<ExtractedOpportunity[] | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function addAndTest() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, url, description, language }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'create failed');
      setPendingId(json.id);

      const testRes = await fetch(`/api/admin/sources/${json.id}/test`, { method: 'POST' });
      const testJson = await testRes.json();
      if (!testRes.ok) throw new Error(testJson.error ?? 'test failed');
      setPreview(testJson.opportunities ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmAndScrape() {
    if (!pendingId) return;
    setBusy(true);
    await fetch(`/api/admin/sources/${pendingId}/scrape`, { method: 'POST' });
    setBusy(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPreview(null); setPendingId(null); setError(null); } }}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" /> Add source</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a new source</DialogTitle>
        </DialogHeader>
        {!preview ? (
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1"><Label>URL</Label><Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} /></div>
            <div className="space-y-1"><Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="he">עברית</SelectItem>
                  <SelectItem value="pl">Polski</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            <p className="text-sm text-muted-foreground">{preview.length} opportunities found</p>
            {preview.slice(0, 10).map((o, i) => (
              <div key={i} className="rounded border p-2 text-sm">
                <p className="font-medium">{o.title}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{o.description}</p>
              </div>
            ))}
            {preview.length > 10 && <p className="text-xs text-muted-foreground">+ {preview.length - 10} more</p>}
          </div>
        )}
        <DialogFooter>
          {!preview ? (
            <Button onClick={addAndTest} disabled={busy || !name || !url}>{busy ? 'Testing...' : 'Add & test'}</Button>
          ) : (
            <Button onClick={confirmAndScrape} disabled={busy}>{busy ? '...' : 'Confirm and scrape'}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
