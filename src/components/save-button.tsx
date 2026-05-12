'use client';
import { useEffect, useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

export function SaveButton({ opportunityId }: { opportunityId: string }) {
  const t = useTranslations('opportunity');
  const [saved, setSaved] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user;
      if (!user) return mounted && setSaved(false);
      const { data } = await supabase
        .from('saved_opportunities')
        .select('opportunity_id')
        .eq('profile_id', user.id)
        .eq('opportunity_id', opportunityId)
        .maybeSingle();
      if (mounted) setSaved(!!data);
    });
    return () => {
      mounted = false;
    };
  }, [opportunityId]);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch('/api/saves', {
        method: saved ? 'DELETE' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ opportunityId }),
      });
      if (res.ok) setSaved(!saved);
      else if (res.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button onClick={toggle} disabled={busy || saved === null} variant={saved ? 'secondary' : 'outline'}>
      {saved ? (
        <BookmarkCheck className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
      ) : (
        <Bookmark className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
      )}
      {saved ? t('saved') : t('save')}
    </Button>
  );
}
