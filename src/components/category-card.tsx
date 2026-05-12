import Link from 'next/link';
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
import type { OpportunityCategory } from '@/types/database';

const ICONS: Record<OpportunityCategory, LucideIcon> = {
  'long-term-program': CalendarRange,
  'short-term-program': CalendarClock,
  scholarship: Award,
  internship: Briefcase,
  seminar: BookOpen,
  volunteering: HeartHandshake,
  'online-course': Monitor,
  'youth-exchange': UsersRound,
  'heritage-trip': Landmark,
  other: Sparkles,
};

export function CategoryCard({
  category,
  href,
  title,
  description,
}: {
  category: OpportunityCategory;
  href: string;
  title: string;
  description: string;
}) {
  const Icon = ICONS[category];

  return (
    <Link href={href} className="group block focus-visible:outline-none">
      <Card className="flex h-full min-h-[160px] flex-col items-center justify-center gap-3 p-5 text-center transition hover:border-brand-deep hover:shadow-md focus-within:ring-2 focus-within:ring-ring">
        <Icon
          className="h-9 w-9 text-brand-deep transition-transform group-hover:scale-110 dark:text-brand-sand"
          strokeWidth={1.5}
        />
        <h3 className="font-serif text-lg font-bold leading-tight text-foreground">{title}</h3>
        <p className="block text-xs leading-snug text-muted-foreground md:hidden md:group-hover:block">
          {description}
        </p>
      </Card>
    </Link>
  );
}
