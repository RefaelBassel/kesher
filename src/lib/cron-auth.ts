// Both Vercel Cron (User-Agent: vercel-cron/1.0) and manual hits with `Authorization: Bearer ${CRON_SECRET}` are accepted.
export function authorizeCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // In dev, allow without secret so the route can be tested locally.
    return process.env.NODE_ENV !== 'production';
  }
  const auth = req.headers.get('authorization');
  if (auth === `Bearer ${secret}`) return true;
  // Vercel cron sends a header it signs internally; Vercel docs recommend the Bearer pattern,
  // but also accept the request if it carries the platform UA.
  const ua = req.headers.get('user-agent') ?? '';
  if (ua.includes('vercel-cron')) return true;
  return false;
}
