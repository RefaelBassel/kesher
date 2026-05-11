import { callAI } from '@/lib/ai/router';
import { TRANSLATE_ALL_PROMPT, TRANSLATE_SCHEMA, type Translations } from './prompts';

// Single AI call that returns title/description/short_summary in all 3 languages.
export async function translateAll(
  title: string,
  description: string,
): Promise<{ translations: Translations; tokensUsed: number; provider: 'gemini' | 'groq' }> {
  const { data, tokensUsed, provider } = await callAI<Translations>(
    TRANSLATE_ALL_PROMPT(title, description),
    TRANSLATE_SCHEMA,
  );
  return { translations: data, tokensUsed, provider };
}

export function spreadTranslations(t: Translations) {
  return {
    title_he: t.he?.title ?? null,
    title_en: t.en?.title ?? null,
    title_pl: t.pl?.title ?? null,
    description_he: t.he?.description ?? null,
    description_en: t.en?.description ?? null,
    description_pl: t.pl?.description ?? null,
    short_summary_he: t.he?.short_summary ?? null,
    short_summary_en: t.en?.short_summary ?? null,
    short_summary_pl: t.pl?.short_summary ?? null,
  };
}
