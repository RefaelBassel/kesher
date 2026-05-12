-- ========================================================================
-- Kesher — full schema setup (all 3 migrations + seed data)
-- Copy this entire file and paste into Supabase SQL Editor, then "Run"
-- ========================================================================

-- ========== profiles ==========
create table if not exists public.profiles (
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
create table if not exists public.sources (
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
create table if not exists public.opportunities (
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

create index if not exists opportunities_status_idx on public.opportunities(status);
create index if not exists opportunities_deadline_idx on public.opportunities(deadline);
create index if not exists opportunities_recommended_idx on public.opportunities(recommended) where recommended = true;
create index if not exists opportunities_category_idx on public.opportunities(category);
create index if not exists opportunities_source_idx on public.opportunities(source_id);

-- ========== source_suggestions ==========
create table if not exists public.source_suggestions (
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

create index if not exists source_suggestions_status_idx on public.source_suggestions(status);

-- ========== notifications ==========
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  type text not null check (type in ('new_match','deadline_approaching','recommended','digest')),
  channel text not null check (channel in ('email','push')),
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists notifications_pending_idx on public.notifications(sent_at) where sent_at is null;
create index if not exists notifications_profile_idx on public.notifications(profile_id);

-- ========== scrape_logs ==========
create table if not exists public.scrape_logs (
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

create index if not exists scrape_logs_source_idx on public.scrape_logs(source_id, started_at desc);

-- ========== saved_opportunities ==========
create table if not exists public.saved_opportunities (
  profile_id uuid references public.profiles(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key(profile_id, opportunity_id)
);

-- ========================================================================
-- Row Level Security
-- ========================================================================

alter table public.profiles enable row level security;
alter table public.opportunities enable row level security;
alter table public.sources enable row level security;
alter table public.source_suggestions enable row level security;
alter table public.notifications enable row level security;
alter table public.scrape_logs enable row level security;
alter table public.saved_opportunities enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles" on public.profiles for select using (public.is_admin());

drop policy if exists "Anyone reads active opportunities" on public.opportunities;
create policy "Anyone reads active opportunities" on public.opportunities for select using (status = 'active');

drop policy if exists "Admins manage opportunities" on public.opportunities;
create policy "Admins manage opportunities" on public.opportunities for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage sources" on public.sources;
create policy "Admins manage sources" on public.sources for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage suggestions" on public.source_suggestions;
create policy "Admins manage suggestions" on public.source_suggestions for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications for select using (auth.uid() = profile_id);

drop policy if exists "Admins read all notifications" on public.notifications;
create policy "Admins read all notifications" on public.notifications for select using (public.is_admin());

drop policy if exists "Admins read scrape logs" on public.scrape_logs;
create policy "Admins read scrape logs" on public.scrape_logs for select using (public.is_admin());

drop policy if exists "Users manage own saves" on public.saved_opportunities;
create policy "Users manage own saves" on public.saved_opportunities for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- ========================================================================
-- Triggers and RPC functions
-- ========================================================================

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute procedure public.touch_updated_at();

drop trigger if exists opportunities_touch on public.opportunities;
create trigger opportunities_touch before update on public.opportunities
  for each row execute procedure public.touch_updated_at();

create or replace function public.increment_source_failures(p_source_id uuid, p_error text)
returns void language plpgsql as $$
begin
  update public.sources
  set consecutive_failures = consecutive_failures + 1,
      last_error = p_error,
      last_scraped_at = now(),
      active = case when consecutive_failures + 1 >= 5 then false else active end
  where id = p_source_id;
end; $$;

-- ========================================================================
-- Seed data — 17 initial Jewish education sources
-- ========================================================================

insert into public.sources (name, url, description, language) values
  ('Masa Israel Journey', 'https://www.masaisrael.org/programs/', 'Long-term immersive programs in Israel for ages 16-30 (gap year, study, internship, volunteering).', 'en'),
  ('Birthright Israel', 'https://www.birthrightisrael.com/trip-types', 'Free 10-day educational trips to Israel for Jewish young adults 18-32.', 'en'),
  ('Onward Israel', 'https://www.onwardisrael.org/programs', 'Subsidized internships and academic programs in Israel.', 'en'),
  ('Lauder Foundation', 'https://www.lauderfoundation.com/programs', 'Jewish education and community-building programs across Central and Eastern Europe.', 'en'),
  ('JDC Entwine', 'https://www.jdcentwine.org/programs', 'Global Jewish service and leadership programs by the Joint Distribution Committee.', 'en'),
  ('EUJS - European Union of Jewish Students', 'https://www.eujs.org/seminars-and-events/', 'Seminars, leadership programs, and events for Jewish students across Europe.', 'en'),
  ('Hillel International', 'https://www.hillel.org/jewish/find-experiences/', 'Jewish campus experiences, trips, and learning programs worldwide.', 'en'),
  ('The Jewish Agency for Israel', 'https://www.jewishagency.org/programs/', 'Aliyah, education, and identity programs connecting Diaspora to Israel.', 'en'),
  ('Shavei Israel', 'https://shavei.org/category/news/', 'Programs and outreach for people discovering Jewish roots, including in Poland.', 'en'),
  ('Taube Center for Jewish Life and Learning', 'https://taubecenter.org/programs/', 'Jewish heritage programs in Poland, especially Warsaw and Krakow.', 'en'),
  ('POLIN Museum Education', 'https://www.polin.pl/en/learning', 'Educational programs at the Museum of the History of Polish Jews in Warsaw.', 'en'),
  ('Pardes Institute of Jewish Studies', 'https://www.pardes.org.il/programs/', 'Open, pluralistic Jewish learning programs in Jerusalem for adults of all backgrounds.', 'en'),
  ('Mechon Hadar', 'https://www.hadar.org/torah/learning-opportunities', 'Egalitarian Jewish learning programs and fellowships.', 'en'),
  ('BINA Secular Yeshiva', 'https://www.bina.org.il/en/programs/', 'Secular Jewish learning and social action in Israel.', 'en'),
  ('Nativ College Leadership Program', 'https://www.usy.org/nativ/', 'A gap-year leadership program combining study in Jerusalem with volunteering in Be''er Sheva.', 'en'),
  ('Bronfman Fellowship', 'https://bronfman.org/programs/', 'Pluralistic fellowships for Jewish teens and young adults.', 'en'),
  ('Jewish Heritage Europe', 'https://jewish-heritage-europe.eu/news/', 'Updates on Jewish heritage programs, conferences, and events across Europe.', 'en')
on conflict (url) do nothing;
