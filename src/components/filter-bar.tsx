'use client';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ALL_CATEGORIES } from '@/types/domain';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function FilterBar() {
  const t = useTranslations('filters');
  const tCat = useTranslations('categories');
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const update = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(sp.toString());
      if (value == null || value === '' || value === 'all') params.delete(key);
      else params.set(key, value);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, sp],
  );

  const toggle = useCallback(
    (key: string) => {
      const params = new URLSearchParams(sp.toString());
      if (params.get(key) === '1') params.delete(key);
      else params.set(key, '1');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, sp],
  );

  return (
    <Card className="space-y-5 p-5">
      <div className="space-y-2">
        <Label htmlFor="q">{t('search_placeholder')}</Label>
        <Input
          id="q"
          defaultValue={sp.get('q') ?? ''}
          placeholder={t('search_placeholder')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') update('q', (e.target as HTMLInputElement).value);
          }}
        />
      </div>

      <div className="space-y-2">
        <Label>{t('category')}</Label>
        <Select value={sp.get('category') ?? 'all'} onValueChange={(v) => update('category', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">—</SelectItem>
            {ALL_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {tCat(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t('language')}</Label>
        <Select value={sp.get('language') ?? 'all'} onValueChange={(v) => update('language', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">—</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="he">עברית</SelectItem>
            <SelectItem value="pl">Polski</SelectItem>
            <SelectItem value="ru">Русский</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Checkbox
            checked={sp.get('free') === '1'}
            onCheckedChange={() => toggle('free')}
          />
          {t('free_only')}
        </Label>
        <Label className="flex items-center gap-2">
          <Checkbox
            checked={sp.get('scholarship') === '1'}
            onCheckedChange={() => toggle('scholarship')}
          />
          {t('scholarship')}
        </Label>
      </div>

      <div className="space-y-2">
        <Label>{t('sort_by')}</Label>
        <Select value={sp.get('sort') ?? 'deadline'} onValueChange={(v) => update('sort', v === 'deadline' ? null : v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deadline">{t('sort_deadline')}</SelectItem>
            <SelectItem value="newest">{t('sort_newest')}</SelectItem>
            <SelectItem value="alpha">{t('sort_alphabetical')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => router.replace(pathname, { scroll: false })}
      >
        {t('clear_all')}
      </Button>
    </Card>
  );
}
