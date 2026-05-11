import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createHash } from 'crypto';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function resolveUrl(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

// Stable id for an opportunity: hash of normalized URL + title.
export function hashOpportunity(url: string, title: string): string {
  const normalized = `${url.trim().toLowerCase()}|${title.trim().toLowerCase().replace(/\s+/g, ' ')}`;
  return createHash('sha256').update(normalized).digest('hex').slice(0, 24);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

// Convert a cost in any currency to a rough USD equivalent for budget filtering.
// Conservative static rates — the matcher only needs ballpark, not FX precision.
const FX_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  ILS: 0.27,
  PLN: 0.25,
  GBP: 1.27,
};
export function toUsd(amount: number | null | undefined, currency: string | null | undefined): number | null {
  if (amount == null) return null;
  const rate = FX_TO_USD[(currency ?? 'USD').toUpperCase()] ?? 1;
  return Math.round(amount * rate);
}

export function ageRangeBounds(range: string | null | undefined): [number, number] | null {
  if (!range) return null;
  if (range === '46+') return [46, 120];
  const m = range.match(/^(\d+)-(\d+)$/);
  if (!m) return null;
  return [parseInt(m[1]!, 10), parseInt(m[2]!, 10)];
}

export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
