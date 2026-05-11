import type { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { locales } from '@/lib/i18n/config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kesher.vercel.app';

  const staticPaths = ['', '/opportunities', '/about'];
  const staticEntries = locales.flatMap((locale) =>
    staticPaths.map((p) => ({
      url: `${base}/${locale}${p}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: p === '' ? 1 : 0.7,
    })),
  );

  let oppEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('opportunities')
      .select('id, updated_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(2000);
    oppEntries = (data ?? []).flatMap((o) =>
      locales.map((locale) => ({
        url: `${base}/${locale}/opportunities/${o.id}`,
        lastModified: new Date(o.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
    );
  } catch {
    // Supabase env not configured at build time — that's fine for the static portion.
  }

  return [...staticEntries, ...oppEntries];
}
