'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeadlineBadge } from './deadline-badge';
import { localized, type Opportunity } from '@/types/domain';
import { cn } from '@/lib/utils';

export function OpportunityCard({ opportunity, className }: { opportunity: Opportunity; className?: string }) {
  const locale = useLocale() as 'he' | 'en' | 'pl';
  const tCat = useTranslations('categories');
  const tOpp = useTranslations('opportunity');
  const title = localized(opportunity, 'title', locale);
  const summary = localized(opportunity, 'short_summary', locale) || localized(opportunity, 'description', locale);

  return (
    <Link
      href={`/${locale}/opportunities/${opportunity.id}`}
      className="group block focus-visible:outline-none"
    >
      <Card
        className={cn(
          'overflow-hidden transition hover:shadow-md focus-within:ring-2 focus-within:ring-ring',
          opportunity.recommended && 'ring-2 ring-brand-sand',
          className,
        )}
      >
        <div className="relative aspect-video w-full bg-muted">
          {opportunity.image_url ? (
            <Image
              src={opportunity.image_url}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-deep to-brand-forest text-brand-cream">
              <span className="font-serif text-4xl">ק</span>
            </div>
          )}
          {opportunity.recommended && (
            <div className="absolute left-2 top-2 rtl:left-auto rtl:right-2">
              <Badge variant="accent">★ {tOpp('recommended_banner').split(' ').slice(0, 2).join(' ')}</Badge>
            </div>
          )}
        </div>
        <div className="space-y-3 p-4">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug">{title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{summary}</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {opportunity.category && (
              <Badge variant="outline">{tCat(opportunity.category as any)}</Badge>
            )}
            {opportunity.is_free && <Badge variant="success">{tOpp('free')}</Badge>}
            {opportunity.has_scholarship && !opportunity.is_free && (
              <Badge variant="secondary">{tOpp('scholarship')}</Badge>
            )}
            {opportunity.age_min != null && opportunity.age_max != null && (
              <Badge variant="muted">
                {tOpp('ages', { min: opportunity.age_min, max: opportunity.age_max })}
              </Badge>
            )}
            <DeadlineBadge deadline={opportunity.deadline} />
          </div>
        </div>
      </Card>
    </Link>
  );
}
