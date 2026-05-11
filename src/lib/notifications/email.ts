import { Resend } from 'resend';
import type { Locale } from '@/types/database';
import type { Opportunity } from '@/types/domain';
import { localized } from '@/types/domain';
import { isRtl } from '@/lib/i18n/config';

let _client: Resend | null = null;
function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY not set');
  return (_client ??= new Resend(key));
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'kesher@updates.kesher.app';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kesher.vercel.app';

const labels = {
  en: { match_subject: 'A new opportunity for you', cta: 'View opportunity', deadline: 'Apply by' },
  he: { match_subject: 'הזדמנות חדשה בשבילך', cta: 'לצפייה', deadline: 'מועד אחרון' },
  pl: { match_subject: 'Nowy program dla Ciebie', cta: 'Zobacz program', deadline: 'Termin' },
};

export async function sendNewMatchEmail(to: string, opp: Opportunity, locale: Locale) {
  const dir = isRtl(locale) ? 'rtl' : 'ltr';
  const t = labels[locale] ?? labels.en;
  const title = localized(opp, 'title', locale);
  const summary = localized(opp, 'short_summary', locale) || localized(opp, 'description', locale).slice(0, 200);
  const url = `${APP_URL}/${locale}/opportunities/${opp.id}`;
  const deadlineLine = opp.deadline
    ? `<p style="color:#c4392f;font-weight:600;">${t.deadline}: ${new Date(opp.deadline).toLocaleDateString(locale)}</p>`
    : '';

  const html = `<!doctype html><html dir="${dir}" lang="${locale}"><body style="font-family:sans-serif;background:#faf6f0;padding:24px;">
  <div style="max-width:560px;margin:auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    ${opp.image_url ? `<img src="${opp.image_url}" style="width:100%;height:200px;object-fit:cover" alt="" />` : ''}
    <div style="padding:24px;">
      <h1 style="color:#1e3a5f;margin:0 0 12px;font-size:22px;">${escapeHtml(title)}</h1>
      <p style="color:#374151;line-height:1.5;">${escapeHtml(summary)}</p>
      ${deadlineLine}
      <a href="${url}" style="display:inline-block;background:#1e3a5f;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">${t.cta}</a>
    </div>
    <div style="background:#f9fafb;padding:16px;text-align:center;color:#6b7280;font-size:12px;">Kesher · ${APP_URL}</div>
  </div>
  </body></html>`;

  await client().emails.send({
    from: FROM,
    to,
    subject: `${t.match_subject}: ${title}`,
    html,
  });
}

export async function sendDeadlineReminderEmail(
  to: string,
  opp: Opportunity,
  daysLeft: number,
  locale: Locale,
) {
  const dir = isRtl(locale) ? 'rtl' : 'ltr';
  const title = localized(opp, 'title', locale);
  const url = `${APP_URL}/${locale}/opportunities/${opp.id}`;
  const subject =
    locale === 'he'
      ? `${daysLeft} ימים נותרו: ${title}`
      : locale === 'pl'
        ? `Zostało ${daysLeft} dni: ${title}`
        : `${daysLeft} days left: ${title}`;
  const html = `<!doctype html><html dir="${dir}" lang="${locale}"><body style="font-family:sans-serif;background:#faf6f0;padding:24px;">
  <div style="max-width:560px;margin:auto;background:white;border-radius:12px;padding:24px;">
    <h1 style="color:#c4392f;">${escapeHtml(subject)}</h1>
    <p style="color:#374151;">A program you saved is closing soon.</p>
    <a href="${url}" style="display:inline-block;background:#1e3a5f;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">View opportunity</a>
  </div></body></html>`;

  await client().emails.send({ from: FROM, to, subject, html });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );
}
