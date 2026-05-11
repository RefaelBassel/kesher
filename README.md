# Kesher — קשר

A responsive PWA that aggregates educational opportunities from the Jewish world for the Warsaw Jewish community. Sources are scraped daily, structured by Gemini 2.5 Flash, translated to Hebrew, English and Polish, and matched to each user's profile.

## Stack

- **Next.js 15** (App Router, RSC, TypeScript) on Vercel
- **Tailwind CSS** + custom shadcn-style primitives, full RTL support
- **Supabase** (PostgreSQL + Row Level Security + Auth)
- **Google Gemini 2.5 Flash** for extraction & translation, with **Groq Llama 3.3 70B** as fallback
- **Cheerio** + **Playwright** scrapers
- **Vercel Cron** for daily scrape, notify, and cleanup
- **Resend** for email, **web-push** (VAPID) for push notifications
- **next-intl** for i18n (he/en/pl)

## Local setup

```bash
pnpm install
cp .env.example .env.local
# Fill in env vars (see below)

# Initialize and link Supabase
pnpm dlx supabase init        # only first time
pnpm dlx supabase link --project-ref <project-ref>
pnpm dlx supabase db push     # applies migrations
pnpm dlx supabase db seed     # loads supabase/seed.sql

# Generate fresh types
pnpm db:types

pnpm dev
```

### Required env vars

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service role key (cron, admin) |
| `GOOGLE_GEMINI_API_KEY` | Gemini API (free 1,500 requests/day) |
| `GROQ_API_KEY` | Fallback LLM |
| `RESEND_API_KEY` | Email sending |
| `RESEND_FROM_EMAIL` | Verified `From:` address |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web push |
| `VAPID_SUBJECT` | `mailto:` URI for VAPID |
| `ADMIN_EMAILS` | Comma-separated admin emails (auto-promoted on login) |
| `CRON_SECRET` | Bearer token for cron routes |
| `NEXT_PUBLIC_APP_URL` | Production URL (used in emails, sitemap) |

Generate VAPID keys once with `pnpm dlx web-push generate-vapid-keys`.

## Running the scraper manually

```bash
pnpm scrape:once                     # all due sources
pnpm scrape:once <source-uuid>       # one source
```

The cron route can also be triggered manually:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/scrape
```

## Deployment

1. Push to GitHub.
2. Import in Vercel.
3. Add all env vars under **Project → Settings → Environment Variables**.
4. Cron jobs auto-register from `vercel.json`.
5. In Supabase, add the production domain to **Auth → URL Configuration → Redirect URLs**.

## Architecture

```
src/
  app/
    [locale]/         # all human-facing pages (he/en/pl)
      page.tsx
      opportunities/  # list + detail
      profile/ saved/ onboarding/
      admin/          # dashboard, sources, opportunities, suggestions, users, logs
    api/
      cron/           # scrape, notify, cleanup
      admin/          # source/opportunity/suggestion management
      saves/          # bookmark toggle
      push/           # subscription
  lib/
    scraper/          # fetch → extract → translate → upsert
    ai/               # Gemini + Groq with router (fallback)
    notifications/    # email, push, matcher
    supabase/         # browser, server, admin clients
    i18n/             # routing, request config
  components/         # shadcn-style UI primitives + domain components
  messages/           # he.json, en.json, pl.json
supabase/
  migrations/         # initial schema, RLS, triggers
  seed.sql            # initial source list
```

## Adding a fourth language

1. Add the locale code (e.g. `'ru'`) to `src/lib/i18n/config.ts`.
2. Create `src/messages/ru.json` (copy from `en.json` and translate).
3. Add the column-name pattern to `Database['public']['Tables']['opportunities']['Row']` (e.g. `title_ru`) — and add the migration that adds those columns.
4. Update the scraper's `TRANSLATE_SCHEMA` and `TRANSLATE_ALL_PROMPT` to include the new locale.
5. Update `spreadTranslations` in `src/lib/scraper/translate.ts`.

## License

MIT
