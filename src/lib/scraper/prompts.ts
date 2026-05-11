import type { Locale } from '@/types/database';

export const EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    opportunities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          url: { type: 'string' },
          image_url: { type: 'string', nullable: true },
          category: { type: 'string' },
          age_min: { type: 'integer', nullable: true },
          age_max: { type: 'integer', nullable: true },
          languages: { type: 'array', items: { type: 'string' } },
          cost_amount: { type: 'number', nullable: true },
          cost_currency: { type: 'string', nullable: true },
          is_free: { type: 'boolean' },
          has_scholarship: { type: 'boolean' },
          deadline: { type: 'string', nullable: true },
          start_date: { type: 'string', nullable: true },
          end_date: { type: 'string', nullable: true },
          location: { type: 'string', nullable: true },
          duration_text: { type: 'string', nullable: true },
        },
        required: ['title', 'description', 'url', 'category', 'is_free', 'has_scholarship'],
      },
    },
    mentioned_organizations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          url: { type: 'string' },
          context: { type: 'string' },
        },
        required: ['name', 'url'],
      },
    },
  },
  required: ['opportunities', 'mentioned_organizations'],
} as const;

export const EXTRACT_OPPORTUNITIES_PROMPT = (
  html: string,
  sourceName: string,
  sourceUrl: string,
) => `You are extracting educational opportunities from a Jewish organization's webpage.

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
      "languages": ["en", "he", ...],
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

export const TRANSLATE_SCHEMA = {
  type: 'object',
  properties: {
    he: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        short_summary: { type: 'string' },
      },
      required: ['title', 'description', 'short_summary'],
    },
    en: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        short_summary: { type: 'string' },
      },
      required: ['title', 'description', 'short_summary'],
    },
    pl: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        short_summary: { type: 'string' },
      },
      required: ['title', 'description', 'short_summary'],
    },
  },
  required: ['he', 'en', 'pl'],
} as const;

export const TRANSLATE_ALL_PROMPT = (title: string, description: string) => `Translate the following Jewish educational program info to Hebrew, English, and Polish — all three in one response.

Keep proper nouns (program names, organization names, places like Jerusalem/Warsaw/Be'er Sheva) in the original form when widely recognized.
Generate a 1-sentence "short_summary" (max 120 chars) in each language for use in cards.

Return JSON exactly in this shape:
{
  "he": {"title": "...", "description": "...", "short_summary": "..."},
  "en": {"title": "...", "description": "...", "short_summary": "..."},
  "pl": {"title": "...", "description": "...", "short_summary": "..."}
}

ORIGINAL:
Title: ${title}
Description: ${description}
`;

export interface ExtractedOpportunity {
  title: string;
  description: string;
  url: string;
  image_url: string | null;
  category: string;
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
}

export interface ExtractedMention {
  name: string;
  url: string;
  context?: string;
}

export interface ExtractionResult {
  opportunities: ExtractedOpportunity[];
  mentioned_organizations: ExtractedMention[];
}

export type Translations = Record<Locale, { title: string; description: string; short_summary: string }>;
