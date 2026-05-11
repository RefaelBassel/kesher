import { NextResponse } from 'next/server';
import { getDueSources, scrapeSource } from '@/lib/scraper';
import { authorizeCron } from '@/lib/cron-auth';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const due = await getDueSources(20);
  const outcomes = [];

  for (const source of due) {
    try {
      const outcome = await scrapeSource(source.id);
      outcomes.push(outcome);
    } catch (e) {
      outcomes.push({ sourceId: source.id, error: (e as Error).message });
    }
    // Spread out requests so we don't blow Gemini's free quota.
    await new Promise((r) => setTimeout(r, 60_000));
  }

  return NextResponse.json({
    ran: outcomes.length,
    outcomes,
    timestamp: new Date().toISOString(),
  });
}
