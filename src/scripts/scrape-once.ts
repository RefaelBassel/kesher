// Manual one-shot scrape for local debugging.
// Usage:
//   pnpm scrape:once          → scrape all due sources
//   pnpm scrape:once <id>     → scrape one source by id
import 'dotenv/config';
import { getDueSources, scrapeSource } from '@/lib/scraper';

async function main() {
  const id = process.argv[2];
  if (id) {
    const out = await scrapeSource(id);
    console.log(JSON.stringify(out, null, 2));
    return;
  }
  const due = await getDueSources(20);
  console.log(`scraping ${due.length} sources`);
  for (const s of due) {
    const out = await scrapeSource(s.id);
    console.log(s.name, '→', out);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
