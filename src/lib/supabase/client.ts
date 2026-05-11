'use client';

import { createBrowserClient } from '@supabase/ssr';

// Once `pnpm db:types` runs against a linked Supabase project, swap in `Database` from `@/types/database`.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
