'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

type Row = {
  id: string;
  name: string;
  url: string;
  context: string | null;
  sources?: { name: string } | null;
};

export function SuggestionsList({ items }: { items: Row[] }) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function act(id: string, action: 'approve' | 'reject') {
    setBusyId(id);
    await fetch(`/api/admin/suggestions/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setBusyId(null);
    router.refresh();
  }

  if (items.length === 0) {
    return <p className="text-muted-foreground">{t('no_suggestions')}</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((s) => (
        <Card key={s.id} className="p-4 space-y-2">
          <p className="font-medium">{s.name}</p>
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:underline">
            {s.url}
          </a>
          {s.context && <p className="line-clamp-3 text-sm">"{s.context}"</p>}
          {s.sources?.name && <p className="text-xs text-muted-foreground">Mentioned by {s.sources.name}</p>}
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={() => act(s.id, 'approve')} disabled={busyId === s.id}>
              {t('approve')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => act(s.id, 'reject')} disabled={busyId === s.id}>
              {t('reject')}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
