'use client';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/lib/i18n/routing';
import { localeNames, locales, type Locale } from '@/lib/i18n/config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Select value={locale} onValueChange={(v) => router.replace(pathname, { locale: v as Locale })}>
      <SelectTrigger className="w-[140px]">
        <Languages className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((l) => (
          <SelectItem key={l} value={l}>
            {localeNames[l]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
