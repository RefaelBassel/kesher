// Hand-authored placeholder for `supabase gen types typescript --linked`.
// Run `pnpm db:types` after linking the project to regenerate from the live schema.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Locale = 'he' | 'en' | 'pl';
export type AgeRange = '13-17' | '18-22' | '23-30' | '31-45' | '46+';
export type ProfileRole = 'user' | 'admin';
export type SourceLanguage = 'he' | 'en' | 'pl' | 'other';
export type ScrapeType = 'auto' | 'list-page' | 'single-page' | 'rss' | 'playwright';
export type OpportunityCategory =
  | 'long-term-program'
  | 'short-term-program'
  | 'scholarship'
  | 'internship'
  | 'seminar'
  | 'volunteering'
  | 'online-course'
  | 'youth-exchange'
  | 'heritage-trip'
  | 'other';
export type OpportunityStatus = 'active' | 'expired' | 'draft' | 'pending_review' | 'rejected';
export type SuggestionStatus = 'pending' | 'approved' | 'rejected';
export type NotificationType = 'new_match' | 'deadline_approaching' | 'recommended' | 'digest';
export type NotificationChannel = 'email' | 'push';

interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  locale: Locale;
  age_range: AgeRange | null;
  languages: string[];
  interests: string[];
  max_budget_usd: number | null;
  scholarship_only: boolean;
  notify_email: boolean;
  notify_push: boolean;
  push_subscription: Json | null;
  role: ProfileRole;
  created_at: string;
  updated_at: string;
}

interface SourceRow {
  id: string;
  name: string;
  url: string;
  description: string | null;
  language: SourceLanguage;
  scrape_type: ScrapeType;
  scrape_config: Json;
  active: boolean;
  last_scraped_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  consecutive_failures: number;
  check_frequency_hours: number;
  created_by: string | null;
  created_at: string;
}

interface OpportunityRow {
  id: string;
  source_id: string | null;
  external_id: string;
  url: string;
  title_he: string | null;
  title_en: string | null;
  title_pl: string | null;
  description_he: string | null;
  description_en: string | null;
  description_pl: string | null;
  short_summary_he: string | null;
  short_summary_en: string | null;
  short_summary_pl: string | null;
  image_url: string | null;
  category: OpportunityCategory | null;
  age_min: number | null;
  age_max: number | null;
  languages: string[];
  cost_amount: number | null;
  cost_currency: string | null;
  is_free: boolean;
  has_scholarship: boolean;
  deadline: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  duration_text: string | null;
  status: OpportunityStatus;
  recommended: boolean;
  recommended_note: string | null;
  raw_extracted: Json | null;
  discovered_at: string;
  updated_at: string;
}

interface SourceSuggestionRow {
  id: string;
  name: string;
  url: string;
  context: string | null;
  mentioned_in_source_id: string | null;
  status: SuggestionStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface NotificationRow {
  id: string;
  profile_id: string;
  opportunity_id: string;
  type: NotificationType;
  channel: NotificationChannel;
  sent_at: string | null;
  error: string | null;
  created_at: string;
}

interface ScrapeLogRow {
  id: string;
  source_id: string | null;
  started_at: string;
  completed_at: string | null;
  new_count: number | null;
  updated_count: number | null;
  total_found: number | null;
  tokens_used: number | null;
  error: string | null;
  provider: string | null;
}

interface SavedOpportunityRow {
  profile_id: string;
  opportunity_id: string;
  saved_at: string;
}

type Optional<T, K extends keyof T> = Partial<T> & Pick<T, K>;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Optional<ProfileRow, 'id' | 'email'>;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      sources: {
        Row: SourceRow;
        Insert: Optional<SourceRow, 'name' | 'url'>;
        Update: Partial<SourceRow>;
        Relationships: [];
      };
      opportunities: {
        Row: OpportunityRow;
        Insert: Optional<OpportunityRow, 'external_id' | 'url'>;
        Update: Partial<OpportunityRow>;
        Relationships: [];
      };
      source_suggestions: {
        Row: SourceSuggestionRow;
        Insert: Optional<SourceSuggestionRow, 'name' | 'url'>;
        Update: Partial<SourceSuggestionRow>;
        Relationships: [];
      };
      notifications: {
        Row: NotificationRow;
        Insert: Optional<NotificationRow, 'profile_id' | 'opportunity_id' | 'type' | 'channel'>;
        Update: Partial<NotificationRow>;
        Relationships: [];
      };
      scrape_logs: {
        Row: ScrapeLogRow;
        Insert: Partial<ScrapeLogRow>;
        Update: Partial<ScrapeLogRow>;
        Relationships: [];
      };
      saved_opportunities: {
        Row: SavedOpportunityRow;
        Insert: Optional<SavedOpportunityRow, 'profile_id' | 'opportunity_id'>;
        Update: Partial<SavedOpportunityRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_source_failures: {
        Args: { p_source_id: string; p_error: string };
        Returns: void;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
