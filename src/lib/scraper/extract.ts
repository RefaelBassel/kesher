import { callAI } from '@/lib/ai/router';
import { EXTRACT_OPPORTUNITIES_PROMPT, EXTRACT_SCHEMA, type ExtractionResult } from './prompts';
import { fetchPage, stripHtml } from './fetch';
import { normalizeOpportunity } from './normalize';

export async function extractFromUrl(
  sourceName: string,
  sourceUrl: string,
  useDynamic = false,
): Promise<{ result: ExtractionResult; tokensUsed: number; provider: 'gemini' | 'groq' }> {
  const html = await fetchPage(sourceUrl, useDynamic);
  const cleaned = stripHtml(html);

  const { data, tokensUsed, provider } = await callAI<ExtractionResult>(
    EXTRACT_OPPORTUNITIES_PROMPT(cleaned, sourceName, sourceUrl),
    EXTRACT_SCHEMA,
  );

  const opportunities = (data.opportunities ?? [])
    .map((o) => normalizeOpportunity(o, sourceUrl))
    .filter((o): o is NonNullable<typeof o> => o !== null);

  const mentioned = (data.mentioned_organizations ?? []).filter(
    (m) => m.url && m.name && m.url.startsWith('http'),
  );

  return {
    result: { opportunities, mentioned_organizations: mentioned },
    tokensUsed,
    provider,
  };
}
