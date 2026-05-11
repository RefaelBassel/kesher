import type { ExtractedOpportunity } from './prompts';
import type { OpportunityCategory } from '@/types/database';
import { ALL_CATEGORIES } from '@/types/domain';
import { isValidUrl, resolveUrl } from '@/lib/utils';

export function normalizeOpportunity(
  raw: ExtractedOpportunity,
  baseUrl: string,
): ExtractedOpportunity | null {
  if (!raw.title || !raw.url) return null;

  const url = isValidUrl(raw.url) ? raw.url : resolveUrl(raw.url, baseUrl);
  if (!isValidUrl(url)) return null;

  const category = (ALL_CATEGORIES as string[]).includes(raw.category)
    ? (raw.category as OpportunityCategory)
    : 'other';

  return {
    ...raw,
    url,
    category,
    image_url: raw.image_url && isValidUrl(raw.image_url) ? raw.image_url : null,
    languages: Array.isArray(raw.languages) ? raw.languages.map((l) => l.toLowerCase().slice(0, 5)) : [],
    deadline: parseDate(raw.deadline),
    start_date: parseDate(raw.start_date),
    end_date: parseDate(raw.end_date),
    cost_amount: raw.is_free ? 0 : raw.cost_amount,
  };
}

function parseDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
