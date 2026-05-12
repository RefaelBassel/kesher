'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Languages, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TranslateMissingButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/translate-missing', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      setResult(`Translated ${json.updated} / ${json.found} (${json.failed} failed)`);
      router.refresh();
    } catch (e) {
      setResult('Error: ' + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={run} disabled={busy}>
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin ltr:mr-2 rtl:ml-2" />
        ) : (
          <Languages className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
        )}
        {busy ? 'Translating...' : 'Translate now'}
      </Button>
      {result && <p className="text-xs text-muted-foreground">{result}</p>}
    </div>
  );
}
