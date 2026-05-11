import * as cheerio from 'cheerio';

const USER_AGENT = 'KesherBot/1.0 (+https://kesher.app/bot)';

export async function fetchPage(url: string, useDynamic = false): Promise<string> {
  if (useDynamic) {
    // Dynamic import keeps Playwright out of the edge runtime + serverless cold path
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    try {
      const ctx = await browser.newContext({ userAgent: USER_AGENT });
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
      return await page.content();
    } finally {
      await browser.close();
    }
  }

  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
    signal: AbortSignal.timeout(15_000),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return await res.text();
}

// Strip script/style/noscript tags and excess whitespace so the prompt fits more signal per token.
export function stripHtml(html: string): string {
  const $ = cheerio.load(html);
  $('script, style, noscript, svg, iframe, link[rel="stylesheet"]').remove();
  $('[style]').removeAttr('style');
  $('[class]').removeAttr('class');
  // Keep image alt + src; drop other attributes that bloat the prompt.
  return $.html().replace(/\s+/g, ' ').trim();
}
