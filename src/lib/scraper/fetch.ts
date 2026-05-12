import * as cheerio from 'cheerio';

// Many Jewish org sites use Cloudflare/Akamai which 403 unknown bots.
// We identify as a modern Chrome to get past those checks while still being honest in fallback.
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// In production (Vercel) Playwright won't fit in the serverless bundle,
// so we route dynamic sources through ScrapingBee instead.
async function fetchViaScrapingBee(url: string): Promise<string> {
  const key = process.env.SCRAPINGBEE_API_KEY;
  if (!key) throw new Error('SCRAPINGBEE_API_KEY not set');
  const params = new URLSearchParams({
    api_key: key,
    url,
    render_js: 'true',
    premium_proxy: 'true',
    // 'us' usually has the highest pool of clean residential IPs and is rarely geo-blocked.
    country_code: 'us',
    wait: '4000',
    // Don't strip images/css — some sites detect bots by missing resource loads.
    block_resources: 'false',
  });
  const res = await fetch(`https://app.scrapingbee.com/api/v1?${params}`, {
    signal: AbortSignal.timeout(120_000),
  });
  const body = await res.text();
  // ScrapingBee sometimes returns the actual target HTML even with a non-200 status
  // (e.g. 404 when a redirect chain ends weirdly). If the body looks like a real HTML
  // page (has substantial content), use it. Only throw on genuine empty/short responses.
  if (!res.ok && body.length < 500) {
    throw new Error(`ScrapingBee HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  return body;
}

export async function fetchPage(url: string, useDynamic = false): Promise<string> {
  if (useDynamic) {
    // Prefer ScrapingBee (works in Vercel serverless). Fall back to local Playwright in dev if no key.
    if (process.env.SCRAPINGBEE_API_KEY) {
      return await fetchViaScrapingBee(url);
    }
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    try {
      const ctx = await browser.newContext({
        userAgent: USER_AGENT,
        locale: 'en-US',
        timezoneId: 'Europe/Warsaw',
      });
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await page.waitForTimeout(2_500);
      await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
      return await page.content();
    } finally {
      await browser.close();
    }
  }

  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,he;q=0.8,pl;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
    },
    signal: AbortSignal.timeout(20_000),
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
