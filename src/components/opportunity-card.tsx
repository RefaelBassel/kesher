'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import {
  CalendarRange,
  CalendarClock,
  Award,
  Briefcase,
  BookOpen,
  HeartHandshake,
  Monitor,
  UsersRound,
  Landmark,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeadlineBadge } from './deadline-badge';
import { localized, type Opportunity } from '@/types/domain';
import type { OpportunityCategory } from '@/types/database';
import { cn } from '@/lib/utils';

// Each category gets its own gradient + icon so cards without an image still look intentional.
const CATEGORY_STYLE: Record<OpportunityCategory, { gradient: string; Icon: LucideIcon }> = {
  'long-term-program': { gradient: 'from-brand-deep via-[#234e7a] to-brand-forest', Icon: CalendarRange },
  'short-term-program': { gradient: 'from-brand-deep via-[#1f5a7a] to-[#2b7a8a]', Icon: CalendarClock },
  scholarship: { gradient: 'from-brand-deep via-[#3e4a8a] to-brand-sand', Icon: Award },
  internship: { gradient: 'from-[#1f4870] via-[#2c5f7a] to-brand-forest', Icon: Briefcase },
  seminar: { gradient: 'from-brand-deep via-[#2c3e6f] to-[#3e5582]', Icon: BookOpen },
  volunteering: { gradient: 'from-brand-forest via-[#3e6b4d] to-[#2c5a3d]', Icon: HeartHandshake },
  'online-course': { gradient: 'from-[#1e3a5f] via-[#2c5a8a] to-[#3a7aa8]', Icon: Monitor },
  'youth-exchange': { gradient: 'from-[#2d5a3d] via-[#3e6b4d] to-brand-sand', Icon: UsersRound },
  'heritage-trip': { gradient: 'from-brand-deep via-[#5a4338] to-brand-accent', Icon: Landmark },
  other: { gradient: 'from-brand-deep via-[#3a4068] to-brand-forest', Icon: Sparkles },
};

export function OpportunityCard({ opportunity, className }: { opportunity: Opportunity; className?: string }) {
  const locale = useLocale() as 'he' | 'en' | 'pl';
  const tCat = useTranslations('categories');
  const tOpp = useTranslations('opportunity');
  const title = localized(opportunity, 'title', locale);
  const summary = localized(opportunity, 'short_summary', locale) || localized(opportunity, 'description', locale);
  const style = CATEGORY_STYLE[(opportunity.category as OpportunityCategory) ?? 'other'];
  const { Icon } = style;

  return (
    <Link
      href={`/${locale}/opportunities/${opportunity.id}`}
      className="group block focus-visible:outline-none"
    >
      <Card
        className={cn(
          'overflow-hidden transition hover:shadow-lg hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-ring',
          opportunity.recommended && 'ring-2 ring-brand-sand',
          className,
        )}
      >
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {opportunity.image_url ? (
            <Image
              src={opportunity.image_url}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div
              className={cn(
                'relative flex h-full w-full items-center justify-center bg-gradient-to-br text-brand-cream',
                style.gradient,
              )}
            >
              {/* Decorative geometric pattern */}
              <svg
                aria-hidden
                className="absolute inset-0 h-full w-full opacity-15"
                viewBox="0 0 400 225"
                preserveAspectRatio="xMidYMid slice"
              >
                <defs>
                  <pattern id={`star-${opportunity.id}`} x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path
                      d="M30 8 L34 22 L48 22 L37 30 L41 44 L30 36 L19 44 L23 30 L12 22 L26 22 Z"
                      fill="currentColor"
                      opacity="0.4"
                    />
                  </pattern>
                </defs>
                <rect width="400" height="225" fill={`url(#star-${opportunity.id})`} />
              </svg>
              {/* Subtle brand mark */}
              <span className="absolute bottom-2 font-serif text-2xl opacity-30 ltr:right-3 rtl:left-3">ק</span>
              {/* Main icon */}
              <Icon className="relative h-16 w-16 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.2} />
            </div>
          )}
          {opportunity.recommended && (
            <div className="absolute top-2 ltr:left-2 rtl:right-2">
              <Badge variant="accent" className="shadow-sm">
                ★ {tOpp('recommended_banner').split(' ').slice(0, 2).join(' ')}
              </Badge>
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
