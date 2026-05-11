export const locales = ['en', 'he', 'pl'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const rtlLocales: Locale[] = ['he'];

export function isRtl(locale: string): boolean {
  return rtlLocales.includes(locale as Locale);
}

export function getDirection(locale: string): 'ltr' | 'rtl' {
  return isRtl(locale) ? 'rtl' : 'ltr';
}

export const localeNames: Record<Locale, string> = {
  en: 'English',
  he: 'עברית',
  pl: 'Polski',
};
