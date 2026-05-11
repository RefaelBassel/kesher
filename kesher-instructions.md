# הנחיות בנייה: Kesher — פלטפורמת הזדמנויות חינוכיות לקהילה היהודית בוורשה

## הנחיות עבודה ל-Claude Code

**עבוד באופן רציף ואוטונומי לאורך כל המסמך. אל תעצור לאישורים בין שלבים.** בצע את כל השלבים ברצף, עשה commits גרנולריים אחרי כל שלב משמעותי, ודווח רק על שגיאות אמיתיות שדורשות החלטה אנושית. השתמש ב-`pnpm` כמנהל החבילות.

אם נתקלת בבחירה טכנית קטנה שלא צוינה במסמך — קבל החלטה סבירה בעצמך והמשך. תעד את ההחלטה בהערה בקוד.

---

## חלק 0: סקירה כללית

### מה אנחנו בונים

**Kesher** (קשר) — אתר רספונסיבי + PWA (Progressive Web App, ניתן להתקנה כאפליקציה) שמרכז הזדמנויות חינוכיות מהעולם היהודי לקהילה היהודית בוורשה. המערכת **סורקת אוטומטית** ארגונים יהודיים פעם ביום, מחלצת הזדמנויות חדשות באמצעות Gemini API, מתרגמת ל-3 שפות, ושולחת התראות לחברי קהילה לפי פרופיל אישי.

### משתמשי המערכת

1. **חבר קהילה** — נרשם, ממלא פרופיל (גיל, שפות, תחומי עניין, תקציב), מקבל המלצות מותאמות והתראות.
2. **אדמין (הרב דוד שיחובסקי)** — מנהל מקורות, מאשר הצעות אוטומטיות לארגונים חדשים, מסמן תוכניות כ"מומלץ ע"י הקהילה".

### עקרון מפתח: אוטונומיה מלאה

המערכת חייבת לתחזק את עצמה. האדמין לא צריך לחפש מידע ברשת. הסקרייפר רץ מדי יום, Gemini מנתח, מתרגם, ומחלץ נתונים מובנים. הצעות להוספת ארגונים חדשים מופיעות לאדמין באישור בלחיצה.

---

## חלק 1: סטאק טכני

| רכיב | טכנולוגיה | הערות |
|---|---|---|
| Framework | **Next.js** (latest stable, App Router) | TypeScript, RSC |
| UI | **Tailwind CSS** + **shadcn/ui** | תמיכה ב-RTL |
| מסד נתונים + Auth | **Supabase** | PostgreSQL + Row Level Security |
| Hosting | **Vercel** | Hobby tier, חינמי |
| AI | **Google Gemini 2.5 Flash** (חינמי, 1500 בקשות/יום) | עם **Groq Llama 3.3 70B** כ-fallback |
| Scraping | **Cheerio** + **Playwright** (לדפים דינמיים) | |
| Cron | **Vercel Cron Jobs** | פעם ביום, 06:00 UTC |
| מייל | **Resend** | חינמי עד 3000/חודש |
| Push | **web-push** (VAPID) | חינמי |
| i18n | **next-intl** | עברית, אנגלית, פולנית |
| Forms | **react-hook-form** + **zod** | |
| State | **TanStack Query** + Zustand (לפרופיל) | |
| Analytics | **Vercel Analytics** | חינמי |

### משתני סביבה (`.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Gemini
GOOGLE_GEMINI_API_KEY=

# Groq fallback
GROQ_API_KEY=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=kesher@updates.yourdomain.com

# Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@kesher.app

# Admin
ADMIN_EMAILS=david.shichowsky@example.com,raphael@example.com
CRON_SECRET=
NEXT_PUBLIC_APP_URL=https://kesher.vercel.app
```

צור קובץ `.env.example` עם כל המפתחות הנ"ל וערכים ריקים, ו-`.gitignore` שמתעלם מ-`.env.local`.

---

## חלק 2: מודל הנתונים (Supabase)

צור migrations ב-`supabase/migrations/`. הפעל `pnpm dlx supabase init` בתחילת הפרויקט.

### טבלאות

```sql
-- ========== profiles ==========
-- מרחיב את auth.users של Supabase
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  locale text not null default 'en' check (locale in ('he','en','pl')),
  age_range text check (age_range in ('13-17','18-22','23-30','31-45','46+')),
  languages text[] not null default '{en}',
  interests text[] not null default '{}', -- religious, academic, volunteer, cultural, professional
  max_budget_usd integer, -- nullable = no limit
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
  scrape_config jsonb default '{}', -- selectors, pagination, etc. (auto-discovered by Gemini)
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
  external_id text not null, -- hash(url + normalized_title)
  url text not null,
  -- ML-translated fields
  title_he text,
  title_en text,
  title_pl text,
  description_he text,
  description_en text,
  description_pl text,
  short_summary_he text,
  short_summary_en text,
  short_summary_pl text,
  -- structured data
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
  -- metadata
  status text not null default 'active' check (status in ('active','expired','draft','pending_review','rejected')),
  recommended boolean not null default false,
  recommended_note text, -- "מומלץ ע״י קהילת ורשה: מצוין לסטודנטים..."
  raw_extracted jsonb, -- the full Gemini extraction for debugging
  discovered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_id, external_id)
);

create index opportunities_status_idx on public.opportunities(status);
create index opportunities_deadline_idx on public.opportunities(deadline);
create index opportunities_recommended_idx on public.opportunities(recommended) where recommended = true;

-- ========== source_suggestions ==========
-- ארגונים ש-Gemini זיהה במהלך סריקה ויכולים להתווסף כמקור חדש
create table public.source_suggestions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  context text, -- the paragraph where the mention was found
  mentioned_in_source_id uuid references public.sources(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(url)
);

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
  provider text -- 'gemini' or 'groq'
);

-- ========== saved_opportunities ==========
create table public.saved_opportunities (
  profile_id uuid references public.profiles(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key(profile_id, opportunity_id)
);
```

### Row Level Security

```sql
alter table public.profiles enable row level security;
alter table public.opportunities enable row level security;
alter table public.sources enable row level security;
alter table public.source_suggestions enable row level security;
alter table public.notifications enable row level security;
alter table public.scrape_logs enable row level security;
alter table public.saved_opportunities enable row level security;

-- profiles
create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins read all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- opportunities: public read for active
create policy "Anyone reads active opportunities" on public.opportunities for select using (status = 'active');
create policy "Admins manage opportunities" on public.opportunities for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- sources: admins only
create policy "Admins manage sources" on public.sources for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- source_suggestions: admins only
create policy "Admins manage suggestions" on public.source_suggestions for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- saved
create policy "Users manage own saves" on public.saved_opportunities for all using (auth.uid() = profile_id);

-- trigger: auto-create profile on signup
create or replace function public.handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when new.email = any (string_to_array(current_setting('app.admin_emails', true), ',')) then 'admin' else 'user' end
  );
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

**הערה:** מאחר שהגדרת `app.admin_emails` כ-setting דורשת superuser, במקום זה — בכל login של admin, בדוק ב-middleware אם ה-email נמצא ב-`ADMIN_EMAILS` env var, ועדכן `role = 'admin'` אם צריך.

---

## חלק 3: רשימת מקורות ראשונית (Seed Data)

צור קובץ `supabase/seed.sql` עם הארגונים הבאים. אלה ארגונים ציבוריים שמפרסמים תוכניות בעולם היהודי:

```sql
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
('Jewish Heritage Europe', 'https://jewish-heritage-europe.eu/news/', 'Updates on Jewish heritage programs, conferences, and events across Europe.', 'en');
```

**חשוב:** כש-Claude Code מריץ את ה-seed לראשונה, חלק מה-URLs עשויים להיות לא מדויקים. **אל תעצור** — המערכת מתוכננת להתמודד עם שגיאות סריקה (`consecutive_failures` נספרים). זה דורש סקירה ידנית של האדמין בלוח הבקרה לאחר ההפעלה הראשונה.

---

## חלק 4: מבנה הפרויקט

```
kesher/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (public)/
│   │   │   │   ├── page.tsx                 # homepage
│   │   │   │   ├── opportunities/
│   │   │   │   │   ├── page.tsx             # list + filters
│   │   │   │   │   └── [id]/page.tsx        # detail
│   │   │   │   ├── about/page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── signup/page.tsx
│   │   │   │   └── callback/route.ts
│   │   │   ├── (user)/
│   │   │   │   ├── profile/page.tsx
│   │   │   │   ├── saved/page.tsx
│   │   │   │   └── onboarding/page.tsx      # multi-step on first login
│   │   │   ├── (admin)/
│   │   │   │   └── admin/
│   │   │   │       ├── page.tsx             # dashboard
│   │   │   │       ├── sources/page.tsx
│   │   │   │       ├── opportunities/page.tsx
│   │   │   │       ├── suggestions/page.tsx
│   │   │   │       ├── users/page.tsx
│   │   │   │       └── logs/page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── cron/
│   │   │   │   ├── scrape/route.ts          # daily scrape (Vercel cron)
│   │   │   │   ├── notify/route.ts          # send pending notifications
│   │   │   │   └── cleanup/route.ts         # expire old opportunities
│   │   │   ├── admin/
│   │   │   │   ├── sources/
│   │   │   │   │   ├── route.ts             # POST create, GET list
│   │   │   │   │   ├── [id]/route.ts        # PATCH, DELETE
│   │   │   │   │   ├── [id]/test/route.ts   # test scrape
│   │   │   │   │   └── [id]/scrape/route.ts # manual scrape
│   │   │   │   ├── opportunities/
│   │   │   │   │   └── [id]/route.ts
│   │   │   │   └── suggestions/
│   │   │   │       └── [id]/route.ts        # approve/reject
│   │   │   ├── opportunities/route.ts       # public list with filters
│   │   │   ├── saves/route.ts
│   │   │   └── push/subscribe/route.ts
│   │   ├── globals.css
│   │   ├── manifest.ts                       # PWA manifest
│   │   └── sw.ts                              # service worker
│   ├── components/
│   │   ├── ui/                                # shadcn components
│   │   ├── opportunity-card.tsx
│   │   ├── opportunity-grid.tsx
│   │   ├── filter-bar.tsx
│   │   ├── deadline-badge.tsx
│   │   ├── language-switcher.tsx
│   │   ├── hero.tsx
│   │   ├── admin/
│   │   │   ├── source-form.tsx
│   │   │   ├── source-table.tsx
│   │   │   ├── suggestion-card.tsx
│   │   │   └── stats-cards.tsx
│   │   └── layout/
│   │       ├── header.tsx
│   │       ├── footer.tsx
│   │       └── mobile-nav.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                    # browser client
│   │   │   ├── server.ts                    # server client
│   │   │   └── admin.ts                     # service role client
│   │   ├── scraper/
│   │   │   ├── index.ts                     # main orchestrator
│   │   │   ├── fetch.ts                     # cheerio + playwright dispatcher
│   │   │   ├── extract.ts                   # Gemini call
│   │   │   ├── translate.ts                 # translate to 3 langs
│   │   │   ├── normalize.ts                 # dedupe, hash, validate
│   │   │   └── prompts.ts                   # all prompts
│   │   ├── ai/
│   │   │   ├── gemini.ts
│   │   │   ├── groq.ts
│   │   │   └── router.ts                    # tries Gemini, falls back to Groq
│   │   ├── notifications/
│   │   │   ├── email.ts                     # Resend templates
│   │   │   ├── push.ts                      # web-push
│   │   │   └── matcher.ts                   # matches opportunities to user profiles
│   │   ├── i18n/
│   │   │   ├── config.ts
│   │   │   └── request.ts
│   │   └── utils.ts
│   ├── messages/
│   │   ├── he.json
│   │   ├── en.json
│   │   └── pl.json
│   ├── types/
│   │   ├── database.ts                      # generated from Supabase
│   │   └── domain.ts                        # Opportunity, Source, etc.
│   └── middleware.ts                         # locale + auth
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── public/
│   ├── icons/                                # PWA icons (192, 512)
│   ├── og-image.png
│   └── ...
├── next.config.ts
├── tailwind.config.ts
├── vercel.json                               # cron config
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## חלק 5: שלבי הבנייה

### שלב 5.1: הקמת תשתית

```bash
pnpm create next-app@latest kesher --typescript --tailwind --app --src-dir --turbopack
cd kesher
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add @google/generative-ai groq-sdk
pnpm add resend web-push
pnpm add cheerio playwright
pnpm add next-intl
pnpm add @tanstack/react-query zustand
pnpm add react-hook-form zod @hookform/resolvers
pnpm add date-fns
pnpm add -D @types/web-push supabase
```

הוסף **shadcn/ui** עם תמיכת RTL:
```bash
pnpm dlx shadcn@latest init
# כאשר נשאל: bash style new-york, base color slate, css variables yes
pnpm dlx shadcn@latest add button card input label select textarea checkbox switch dialog dropdown-menu sheet badge tabs toast skeleton avatar form table
```

### שלב 5.2: i18n (next-intl)

הגדר 3 locales: `he` (RTL), `en`, `pl`. ב-`middleware.ts`, זהה את ה-locale ב-URL וטפל ב-redirect. הגדר את ה-`<html lang dir>` בהתאם בכל layout.

צור `src/messages/he.json`, `src/messages/en.json`, `src/messages/pl.json` עם מבנה היררכי:
```json
{
  "common": { "loading": "...", "save": "..." },
  "nav": { "home": "...", "opportunities": "..." },
  "home": { "hero_title": "...", "hero_subtitle": "..." },
  "opportunity": { "deadline": "...", "free": "...", "scholarship": "..." },
  "filters": { ... },
  "profile": { ... },
  "admin": { ... }
}
```

תמלא את כל המפתחות ב-3 השפות. השפה ההתחלתית של הממשק תהיה אנגלית (הקהילה בוורשה לא בהכרח דוברת עברית).

### שלב 5.3: Supabase setup

```bash
pnpm dlx supabase init
pnpm dlx supabase link --project-ref <project-ref>
```

צור את כל ה-migrations מחלק 2, הרץ:
```bash
pnpm dlx supabase db push
pnpm dlx supabase db seed
```

הפק טיפוסים:
```bash
pnpm dlx supabase gen types typescript --linked > src/types/database.ts
```

### שלב 5.4: Supabase clients

צור 3 lib functions:
- `client.ts` — `createBrowserClient` ל-Client Components
- `server.ts` — `createServerClient` עם cookies ל-Server Components ו-Route Handlers
- `admin.ts` — `createClient` עם `SUPABASE_SERVICE_ROLE_KEY` למשימות מערכת (cron, admin)

### שלב 5.5: Auth flow

- `/login` — email/password + Google OAuth (Supabase auth UI מותאם)
- `/signup` — email/password
- `/callback` — handles OAuth redirect
- `middleware.ts` — מעדכן session, מנתב admin
- בכניסה ראשונה אחרי signup, redirect ל-`/onboarding`

**במידל-ויר:** אם user מחובר ו-`profile.role !== 'admin'` אבל ה-email שלו ב-`ADMIN_EMAILS`, עדכן את ה-role ל-admin.

### שלב 5.6: Onboarding (משתמש חדש)

טופס רב-שלבי (3 צעדים) שממלא את שדות ה-profile:
1. **פרטים** — שם מלא, גיל (טווח), שפה מועדפת לממשק
2. **שפות שאתה מבין** — checkboxes (en, pl, he, ru, fr, es...)
3. **תחומי עניין ותקציב** — קטגוריות (לימוד דתי, אקדמי, התנדבות, תרבות, מקצועי), תקציב מקסימלי, האם זקוק למלגה

בסיום, הצג מיד 5 הזדמנויות מומלצות (matcher).

### שלב 5.7: עיצוב — מערכת עיצוב

**פלטה (הגדר ב-Tailwind config):**
```ts
colors: {
  brand: {
    deep: '#1e3a5f',    // כחול ים-תיכוני עמוק
    sand: '#d4a574',    // זהב חולי
    cream: '#faf6f0',   // לבן רך
    accent: '#c4392f',  // אדום עתיק (לדדליינים בוערים)
    forest: '#2d5a3d',  // ירוק זית
  }
}
```

**טיפוגרפיה:**
- עברית: `Heebo` או `Assistant` (Google Fonts)
- אנגלית/פולנית: `Inter`
- כותרות (אנגלית): `Fraunces` (serif) לתחושת קלאסיקה
- בטעינת הפונטים ב-`layout.tsx`, השתמש ב-`next/font/google`

**רכיבי UI מפתח:**
- **OpportunityCard** — תמונה בלייאאוט 16:9, כותרת bold, 2 שורות תקציר, שורת תגיות (גיל, שפה, מחיר), badge דדליין (אדום אם < 14 ימים, צהוב אם < 30, אפור אחרת)
- **DeadlineBadge** — מציג ימים נותרים בפורמט relative בשפה הנכונה
- **Hero** — תמונת רקע אחת חמה (לא AI-generated, אלא דמיון של נופים יהודיים — כותל, ירושלים, ספרים), overlay עם slogan ב-3 שפות
- **FilterBar** — sticky בצד (desktop) או drawer (mobile), עם chips להסרת פילטרים פעילים

### שלב 5.8: Scraper — הלב של המערכת

#### 5.8.1: `src/lib/scraper/fetch.ts`

```ts
export async function fetchPage(url: string, useDynamic = false): Promise<string> {
  if (useDynamic) {
    // Playwright for SPA/JS-heavy pages
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
    const html = await page.content();
    await browser.close();
    return html;
  }
  // Cheerio for static
  const res = await fetch(url, {
    headers: { 'User-Agent': 'KesherBot/1.0 (+https://kesher.app/bot)' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}
```

#### 5.8.2: `src/lib/ai/router.ts`

```ts
import { extractWithGemini } from './gemini';
import { extractWithGroq } from './groq';

export async function callAI<T>(prompt: string, schema: any): Promise<T> {
  try {
    return await extractWithGemini(prompt, schema);
  } catch (e) {
    console.warn('Gemini failed, falling back to Groq:', e);
    return await extractWithGroq(prompt, schema);
  }
}
```

#### 5.8.3: `src/lib/scraper/prompts.ts`

הפרומפט המרכזי לחילוץ הזדמנויות:

```ts
export const EXTRACT_OPPORTUNITIES_PROMPT = (html: string, sourceName: string, sourceUrl: string) => `
You are extracting educational opportunities from a Jewish organization's webpage.

ORGANIZATION: ${sourceName}
PAGE URL: ${sourceUrl}

Below is the HTML content of the page (cleaned). Extract ALL programs, scholarships, internships, seminars, trips, courses, fellowships, or volunteering opportunities mentioned. For each one, return a JSON object with this exact schema:

{
  "opportunities": [
    {
      "title": "exact name as appears",
      "description": "2-4 sentence summary in the page's original language",
      "url": "full absolute URL to the program's own page (resolve relative URLs against ${sourceUrl})",
      "image_url": "URL of the most representative image, or null",
      "category": "one of: long-term-program | short-term-program | scholarship | internship | seminar | volunteering | online-course | youth-exchange | heritage-trip | other",
      "age_min": <integer or null>,
      "age_max": <integer or null>,
      "languages": ["en", "he", ...] (program languages, not page language),
      "cost_amount": <number or null>,
      "cost_currency": "USD" | "EUR" | "ILS" | "PLN" | null,
      "is_free": <boolean>,
      "has_scholarship": <boolean>,
      "deadline": "<ISO 8601 date or null>",
      "start_date": "<ISO 8601 date or null>",
      "end_date": "<ISO 8601 date or null>",
      "location": "<city, country or 'online'>",
      "duration_text": "e.g. '5 months', 'one weekend'"
    }
  ],
  "mentioned_organizations": [
    {"name": "...", "url": "...", "context": "the sentence where it was mentioned"}
  ]
}

RULES:
1. Only extract concrete, actionable opportunities. Skip blog posts, general descriptions of the organization, news articles.
2. If a field is not present, return null. Do NOT invent or guess.
3. Resolve all relative URLs to absolute.
4. For dates without a year, infer the next upcoming occurrence.
5. Return valid JSON only — no markdown, no commentary.

HTML CONTENT:
\`\`\`html
${html.slice(0, 80_000)}
\`\`\`
`;

export const TRANSLATE_PROMPT = (title: string, description: string, targetLang: 'he' | 'en' | 'pl') => `
Translate the following Jewish educational program info to ${targetLang === 'he' ? 'Hebrew' : targetLang === 'pl' ? 'Polish' : 'English'}.
Keep proper nouns (program names, organization names, places) in original form when widely recognized.
Return JSON: {"title": "...", "description": "...", "short_summary": "<1 sentence, max 120 chars>"}

ORIGINAL:
Title: ${title}
Description: ${description}
`;
```

#### 5.8.4: `src/lib/scraper/index.ts`

```ts
export async function scrapeSource(sourceId: string) {
  const supabase = createAdminClient();
  const log = await startScrapeLog(sourceId);

  try {
    const source = await getSource(sourceId);
    const html = await fetchPage(source.url, source.scrape_type === 'playwright');
    const cleanedHtml = stripScripts(html); // remove <script>, <style>

    const extracted = await callAI(
      EXTRACT_OPPORTUNITIES_PROMPT(cleanedHtml, source.name, source.url),
      opportunitySchema
    );

    let newCount = 0, updatedCount = 0;
    for (const opp of extracted.opportunities) {
      const externalId = hashOpportunity(opp.url, opp.title);
      const existing = await findOpportunity(source.id, externalId);

      // translate to all 3 langs (one Gemini call returning all 3 at once)
      const translations = await translateAll(opp.title, opp.description);

      const record = {
        source_id: source.id,
        external_id: externalId,
        url: opp.url,
        ...translations, // title_he, title_en, title_pl, etc.
        image_url: opp.image_url,
        category: opp.category,
        age_min: opp.age_min,
        age_max: opp.age_max,
        languages: opp.languages,
        cost_amount: opp.cost_amount,
        cost_currency: opp.cost_currency,
        is_free: opp.is_free,
        has_scholarship: opp.has_scholarship,
        deadline: opp.deadline,
        start_date: opp.start_date,
        end_date: opp.end_date,
        location: opp.location,
        duration_text: opp.duration_text,
        status: 'active',
        raw_extracted: opp,
      };

      if (existing) {
        await supabase.from('opportunities').update(record).eq('id', existing.id);
        updatedCount++;
      } else {
        await supabase.from('opportunities').insert(record);
        newCount++;
        // queue notifications for matching users
        await queueNotificationsForOpportunity(record);
      }
    }

    // save mentioned organizations as suggestions
    for (const mention of extracted.mentioned_organizations) {
      await supabase.from('source_suggestions').upsert({
        name: mention.name,
        url: mention.url,
        context: mention.context,
        mentioned_in_source_id: source.id,
      }, { onConflict: 'url', ignoreDuplicates: true });
    }

    await completeScrapeLog(log.id, { newCount, updatedCount, total: extracted.opportunities.length });
    await supabase.from('sources').update({
      last_scraped_at: new Date().toISOString(),
      last_success_at: new Date().toISOString(),
      consecutive_failures: 0,
      last_error: null,
    }).eq('id', source.id);

  } catch (error: any) {
    await failScrapeLog(log.id, error.message);
    await supabase.rpc('increment_source_failures', { source_id: sourceId, error_msg: error.message });
  }
}
```

הוסף RPC ב-Supabase:
```sql
create or replace function public.increment_source_failures(source_id uuid, error_msg text)
returns void language plpgsql as $$
begin
  update public.sources
  set consecutive_failures = consecutive_failures + 1,
      last_error = error_msg,
      last_scraped_at = now(),
      active = case when consecutive_failures + 1 >= 5 then false else active end
  where id = source_id;
end; $$;
```

### שלב 5.9: Cron jobs

צור `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/scrape", "schedule": "0 6 * * *" },
    { "path": "/api/cron/notify", "schedule": "0 8 * * *" },
    { "path": "/api/cron/cleanup", "schedule": "0 3 * * *" }
  ]
}
```

`/api/cron/scrape/route.ts`:
- מאמת את ה-`Authorization: Bearer ${CRON_SECRET}` header
- שולף את כל ה-`sources` הפעילים שבהם `last_scraped_at` ישן מ-`check_frequency_hours`
- מריץ אותם בסדרה (לא במקביל, כדי לא לחרוג ממכסת Gemini): 60 שניות בין הזדמנויות
- מקסימום 20 sources לריצה (אם יש יותר, ינוצלו ביום הבא)
- מחזיר JSON עם סיכום

`/api/cron/notify/route.ts`:
- שולף `notifications` שבהם `sent_at is null`
- שולח email/push לפי `channel`
- מעדכן `sent_at`

`/api/cron/cleanup/route.ts`:
- מעדכן `status = 'expired'` להזדמנויות עם `deadline < now() - interval '7 days'`
- מוחק `scrape_logs` ישנים מ-90 ימים

### שלב 5.10: Matcher

`src/lib/notifications/matcher.ts`:
```ts
export async function queueNotificationsForOpportunity(opp: Opportunity) {
  // find profiles where:
  // - notify_email or notify_push is true
  // - age range overlaps with opp.age_min..age_max
  // - at least one of profile.languages overlaps with opp.languages
  // - if profile.scholarship_only: opp.is_free or opp.has_scholarship
  // - if profile.max_budget_usd: opp.cost_amount <= max_budget (in USD equivalent)
  // - opp.category matches profile.interests (interest-to-category mapping)
  const profiles = await findMatchingProfiles(opp);
  for (const p of profiles) {
    if (p.notify_email) await queueNotification(p.id, opp.id, 'new_match', 'email');
    if (p.notify_push) await queueNotification(p.id, opp.id, 'new_match', 'push');
  }
}
```

הוסף גם `deadline_approaching`: ב-cron יומי, מצא הזדמנויות עם `deadline` ב-7 ו-2 ימים מהיום ושלח התראה לכל מי שמורה בשמורים.

### שלב 5.11: עמודי משתמש

**Homepage** (`/[locale]/page.tsx`):
- Hero גדול עם slogan, כפתור "Find your next opportunity"
- סקציה "🔥 Closing soon" — 6 הזדמנויות עם הדדליין הקרוב ביותר
- סקציה "⭐ Recommended by Warsaw community" — איפה ש-`recommended = true`
- סקציה "✨ New this week"
- סקציה "Browse by category" — 8 כרטיסיות גדולות

**Opportunities list** (`/[locale]/opportunities`):
- Sidebar (sticky) עם פילטרים: קטגוריה, גיל, שפה, מחיר/חינם, יש מלגה, מיקום, דדליין
- חיפוש טקסטואלי (Postgres ILIKE על title + description)
- מיון: דדליין קרוב, חדש ביותר, אלפבתי
- Pagination (תצוגת אינסוף - infinite scroll)
- כל פילטר משתקף ב-URL כ-query param (shareable links)

**Opportunity detail** (`/[locale]/opportunities/[id]`):
- תמונה גדולה, כותרת, badges, כל הפרטים
- כפתורי שמירה, "Visit official page" (פותח את source URL ב-tab חדש)
- אם `recommended` — באנר זהוב עם `recommended_note`
- Sticky CTA תחתון ב-mobile

**Profile** (`/[locale]/profile`):
- עריכת כל שדות ה-onboarding
- ניהול התראות (email/push toggles)
- כפתור "Enable push notifications" שמבקש permission ושומר subscription
- מחיקת חשבון

**Saved** (`/[locale]/saved`):
- כל ההזדמנויות ש-user שמר

### שלב 5.12: לוח בקרה אדמיני

**Dashboard** (`/admin`):
- 4 stats cards: סך משתמשים, הזדמנויות פעילות, סריקות השבוע, הצעות ממתינות
- גרף פעילות שבועית
- רשימת אזהרות: sources עם `consecutive_failures >= 3`

**Sources** (`/admin/sources`):
- טבלה: שם, URL, שפה, last scraped, status (active/disabled/failed), כפתורים: edit, scrape now, toggle, delete
- כפתור גדול "Add source" שפותח dialog:
  - שדות: name, url, language, description
  - בלחיצה על "Add & test" — קורא ל-`/api/admin/sources/[id]/test` שמבצע fetch + Gemini extract ומחזיר preview של מה שנמצא
  - אדמין לוחץ "Confirm and scrape" → המקור נשמר ומיד נסרק במלואו

**Opportunities** (`/admin/opportunities`):
- טבלה: title (en), source, status, deadline, recommended toggle, actions
- פילטר לפי status
- ערוך כל שדה inline או ב-dialog
- שדה `recommended_note` עם textarea (בשפת הממשק של האדמין)
- מחיקה דורשת אישור

**Suggestions** (`/admin/suggestions`):
- כרטיסי הצעות (קטנים) — שם, URL, context, מאיזה source זה הגיע
- כפתורי approve (מעביר ל-sources אוטומטית ומריץ test) ו-reject

**Users** (`/admin/users`):
- קריאה בלבד (privacy): סך נרשמים, פילוח לפי גיל/שפה, גרף הצטרפויות
- אין הצגת אימיילים, שמות, או פרטים אישיים

**Logs** (`/admin/logs`):
- 100 ה-`scrape_logs` האחרונים, ניתן לסינון לפי source

### שלב 5.13: Notifications — email & push

**Resend templates** (`src/lib/notifications/email.ts`):
- `newMatchEmail(opportunity, locale)` — תמונה, כותרת, תקציר, CTA
- `digestEmail(opportunities[], locale)` — weekly opt-in digest
- `deadlineReminderEmail(opportunity, daysLeft, locale)`

תמיכה RTL ב-HTML: `<html dir="rtl" lang="he">` באימיילים עבריים. השתמש ב-`@react-email/components` לעיצוב נקי.

**web-push** (`src/lib/notifications/push.ts`):
- צור VAPID keys בפעם הראשונה: `pnpm dlx web-push generate-vapid-keys`
- בצד client: קומפוננטת `PushSetup` שמבקשת permission, רושמת service worker, ושומרת subscription דרך `/api/push/subscribe`
- בצד server: `webpush.sendNotification(subscription, payload)`

### שלב 5.14: PWA

צור `src/app/manifest.ts`:
```ts
import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kesher — קשר',
    short_name: 'Kesher',
    description: 'Educational opportunities for the Warsaw Jewish community',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf6f0',
    theme_color: '#1e3a5f',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
```

צור service worker ב-`public/sw.js` (טפל ב-push event + caching בסיסי). רשום אותו ב-`layout.tsx`.

צור placeholder icons (192x192 ו-512x512) — סמל פשוט (גם אות "ק" בפונט סריף לבן על רקע כחול-עמוק). אפשר להשתמש ב-SVG-to-PNG ידני או בכלי כמו `sharp` בקובץ build script.

### שלב 5.15: SEO & metadata

- `generateMetadata` בכל route עם title, description, og:image
- `robots.txt` ו-`sitemap.ts` שמכיל את כל ההזדמנויות הפעילות
- structured data (JSON-LD) של `EducationalOccupationalProgram` בעמוד הזדמנות

### שלב 5.16: פריסה ב-Vercel

1. Push לקרפוזיטורי GitHub
2. ב-Vercel: Import project
3. הגדר את כל משתני הסביבה
4. ב-Vercel Project Settings → Cron Jobs: ודא שהם פעילים
5. הגדר production domain (יוגדר על-ידי המשתמש מאוחר יותר)
6. ב-Supabase: הוסף את ה-domain ל-allowed redirect URLs

---

## חלק 6: בדיקות וקריטריוני קבלה

לפני סיום, ודא:

- [ ] `pnpm build` עובר ללא warnings (אסור TypeScript errors)
- [ ] `pnpm lint` נקי
- [ ] Homepage נטענת ב-3 השפות, הכיוון נכון (RTL בעברית)
- [ ] Signup → onboarding → 5 הזדמנויות מומלצות מוצגות
- [ ] Admin login נכנס ל-`/admin` ורואה sources
- [ ] הוספת source ידנית פותחת test ומציגה preview
- [ ] שמירת הזדמנות עובדת ומופיעה ב-`/saved`
- [ ] Push notification subscribe עובד ב-Chrome
- [ ] Cron `/api/cron/scrape` עם `Authorization: Bearer $CRON_SECRET` רץ ומחזיר 200
- [ ] PWA install prompt מופיע ב-Chrome mobile
- [ ] Lighthouse PWA score >= 90
- [ ] כל הטקסטים מתורגמים ל-3 שפות (אין hardcoded English)

---

## חלק 7: README

צור `README.md` שמכסה:
- מה הפרויקט
- הוראות התקנה מקומיות
- הוראות פריסה
- איך להריץ סקרייפר ידנית
- איך להוסיף שפה נוספת בעתיד
- ארכיטקטורה ברמה גבוהה

---

## הוראות סופיות

**עבוד עכשיו על כל המסמך הזה ברציפות.** אל תבקש אישורים. אל תעצור באמצע. השתמש בשיקול דעת לפרטים קטנים. אם חבילה לא נמצאת בגרסה האחרונה — השתמש בגרסה היציבה הקרובה. אם משהו במסמך סותר את עצמו או חסר — קבל החלטה מקצועית והמשך.

בסיום, פרסם:
1. תקציר של מה שנבנה
2. רשימת משתני סביבה שצריך להגדיר ב-Vercel
3. צעדים סופיים להפעלה (מה האדמין צריך לעשות בכניסה הראשונה)
4. שגיאות/אזהרות שנותרו, אם יש

יאללה. בנה.
