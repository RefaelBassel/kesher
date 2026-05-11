import type { Database, Locale, OpportunityCategory } from './database';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Source = Database['public']['Tables']['sources']['Row'];
export type SourceInsert = Database['public']['Tables']['sources']['Insert'];

export type Opportunity = Database['public']['Tables']['opportunities']['Row'];
export type OpportunityInsert = Database['public']['Tables']['opportunities']['Insert'];

export type SourceSuggestion = Database['public']['Tables']['source_suggestions']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type ScrapeLog = Database['public']['Tables']['scrape_logs']['Row'];
export type SavedOpportunity = Database['public']['Tables']['saved_opportunities']['Row'];

export const ALL_CATEGORIES: OpportunityCategory[] = [
  'long-term-program',
  'short-term-program',
  'scholarship',
  'internship',
  'seminar',
  'volunteering',
  'online-course',
  'youth-exchange',
  'heritage-trip',
  'other',
];

export const ALL_INTERESTS = ['religious', 'academic', 'volunteer', 'cultural', 'professional'] as const;
export type Interest = (typeof ALL_INTERESTS)[number];

// Map a user's high-level interests to the opportunity categories they should match against.
export const INTEREST_TO_CATEGORIES: Record<Interest, OpportunityCategory[]> = {
  religious: ['long-term-program', 'seminar', 'online-course', 'heritage-trip'],
  academic: ['long-term-program', 'short-term-program', 'scholarship', 'internship', 'online-course'],
  volunteer: ['volunteering', 'youth-exchange', 'short-term-program'],
  cultural: ['heritage-trip', 'seminar', 'youth-exchange', 'short-term-program'],
  professional: ['internship', 'scholarship', 'long-term-program'],
};

export type OpportunityWithSource = Opportunity & {
  sources?: Pick<Source, 'name' | 'url' | 'language'> | null;
};

// Pull a localized field with English fallback so UI never shows a blank.
export function localized<T extends Record<string, any>>(
  obj: T,
  base: 'title' | 'description' | 'short_summary',
  locale: Locale,
): string {
  const order: Locale[] = [locale, 'en', 'he', 'pl'];
  for (const l of order) {
    const v = obj[`${base}_${l}` as keyof T];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return '';
}
