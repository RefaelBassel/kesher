'use client';
import { Badge } from '@/components/ui/badge';
import { useTranslations, useLocale } from 'next-intl';
import { daysUntil } from '@/lib/utils';

export function DeadlineBadge({ deadline }: { deadline: string | null | undefined }) {
  const t = useTranslations('opportunity');
  const locale = useLocale();
  if (!deadline) return <Badge variant="muted">{t('no_deadline')}</Badge>;

  const days = daysUntil(deadline);
  if (days == null) return null;
  if (days < 0) return null;

  const variant = days <= 14 ? 'accent' : days <= 30 ? 'secondary' : 'muted';
  return (
    <Badge variant={variant as any} title={new Date(deadline).toLocaleDateString(locale)}>
      {t('days_left', { days })}
    </Badge>
  );
}
