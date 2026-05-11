-- ========== profiles ==========
-- extends auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  locale text not null default 'en' check (locale in ('he','en','pl')),
  age_range text check (age_range in ('13-17','18-22','23-30','31-45','46+')),
  languages text[] not null default '{en}',
  interests text[] not null default '{}',
  max_budget_usd integer,
  scholarship_only boolean not null default false,
  notify_email boolean not null default true,
  notify_push boolean not null default false,
  push_subscription jsonb,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========== sources ==========
create table public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null unique,
  description text,
  language text not null default 'en' check (language in ('he','en','pl','other')),
  scrape_type text not null default 'auto' check (scrape_type in ('auto','list-page','single-page','rss','playwright')),
  scrape_config jsonb default '{}'::jsonb,
  active boolean not null default true,
  last_scraped_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  consecutive_failures integer not null default 0,
  check_frequency_hours integer not null default 24,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ========== opportunities ==========
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sources(id) on delete cascade,
  external_id text not null,
  url text not null,
  title_he text,
  title_en text,
  title_pl text,
  description_he text,
  description_en text,
  description_pl text,
  short_summary_he text,
  short_summary_en text,
  short_summary_pl text,
  image_url text,
  category text check (category in (
    'long-term-program','short-term-program','scholarship',
    'internship','seminar','volunteering','online-course',
    'youth-exchange','heritage-trip','other'
  )),
  age_min integer,
  age_max integer,
  languages text[] default '{}',
  cost_amount numeric,
  cost_currency text default 'USD',
  is_free boolean not null default false,
  has_scholarship boolean not null default false,
  deadline timestamptz,
  start_date timestamptz,
  end_date timestamptz,
  location text,
  duration_text text,
  status text not null default 'active' check (status in ('active','expired','draft','pending_review','rejected')),
  recommended boolean not null default false,
  recommended_note text,
  raw_extracted jsonb,
  discovered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_id, external_id)
);

create index opportunities_status_idx on public.opportunities(status);
create index opportunities_deadline_idx on public.opportunities(deadline);
create index opportunities_recommended_idx on public.opportunities(recommended) where recommended = true;
create index opportunities_category_idx on public.opportunities(category);
create index opportunities_source_idx on public.opportunities(source_id);

-- ========== source_suggestions ==========
create table public.source_suggestions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  context text,
  mentioned_in_source_id uuid references public.sources(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(url)
);

create index source_suggestions_status_idx on public.source_suggestions(status);

-- ========== notifications ==========
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  type text not null check (type in ('new_match','deadline_approaching','recommended','digest')),
  channel text not null check (channel in ('email','push')),
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create index notifications_pending_idx on public.notifications(sent_at) where sent_at is null;
create index notifications_profile_idx on public.notifications(profile_id);

-- ========== scrape_logs ==========
create table public.scrape_logs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sources(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  new_count integer default 0,
  updated_count integer default 0,
  total_found integer default 0,
  tokens_used integer default 0,
  error text,
  provider text
);

create index scrape_logs_source_idx on public.scrape_logs(source_id, started_at desc);

-- ========== saved_opportunities ==========
create table public.saved_opportunities (
  profile_id uuid references public.profiles(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key(profile_id, opportunity_id)
);
