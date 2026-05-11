'use client';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/domain';
import type { Locale } from '@/lib/i18n/config';

const AGE_RANGES = ['13-17', '18-22', '23-30', '31-45', '46+'] as const;
const KNOWN_LANGS = [
  { code: 'en', label: 'English' },
  { code: 'pl', label: 'Polski' },
  { code: 'he', label: 'עברית' },
  { code: 'ru', label: 'Русский' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
];
const INTERESTS = ['religious', 'academic', 'volunteer', 'cultural', 'professional'] as const;

export function OnboardingWizard({ initial }: { initial?: Partial<Profile> }) {
  const t = useTranslations('onboarding');
  const tInt = useTranslations('interests');
  const locale = useLocale() as Locale;

  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState(initial?.full_name ?? '');
  const [ageRange, setAgeRange] = useState<string>(initial?.age_range ?? '23-30');
  const [interfaceLang, setInterfaceLang] = useState<Locale>((initial?.locale as Locale) ?? locale);
  const [languages, setLanguages] = useState<string[]>(initial?.languages ?? ['en']);
  const [interests, setInterests] = useState<string[]>(initial?.interests ?? []);
  const [budget, setBudget] = useState<string>(initial?.max_budget_usd?.toString() ?? '');
  const [scholarshipOnly, setScholarshipOnly] = useState<boolean>(initial?.scholarship_only ?? false);

  function toggleArr(arr: string[], v: string) {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  async function finish() {
    setBusy(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email!,
        full_name: fullName || null,
        age_range: ageRange as any,
        locale: interfaceLang,
        languages,
        interests,
        max_budget_usd: budget ? parseInt(budget, 10) : null,
        scholarship_only: scholarshipOnly,
      });
    window.location.href = `/${interfaceLang}/onboarding/done`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('welcome')} · <span className="text-muted-foreground text-sm font-normal">{t('step', { n: step, total: 3 })}</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t('step1_title')}</h2>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('age_range')}</Label>
              <Select value={ageRange} onValueChange={setAgeRange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AGE_RANGES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('interface_lang')}</Label>
              <Select value={interfaceLang} onValueChange={(v) => setInterfaceLang(v as Locale)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="he">עברית</SelectItem>
                  <SelectItem value="pl">Polski</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t('step2_title')}</h2>
            <p className="text-sm text-muted-foreground">{t('languages_known')}</p>
            <div className="grid grid-cols-2 gap-3">
              {KNOWN_LANGS.map((l) => (
                <Label key={l.code} className="flex items-center gap-2">
                  <Checkbox
                    checked={languages.includes(l.code)}
                    onCheckedChange={() => setLanguages(toggleArr(languages, l.code))}
                  />
                  {l.label}
                </Label>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t('step3_title')}</h2>
            <p className="text-sm text-muted-foreground">{t('interests_label')}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {INTERESTS.map((i) => (
                <Label key={i} className="flex items-center gap-2">
                  <Checkbox
                    checked={interests.includes(i)}
                    onCheckedChange={() => setInterests(toggleArr(interests, i))}
                  />
                  {tInt(i)}
                </Label>
              ))}
            </div>
            <div className="space-y-2 pt-2">
              <Label htmlFor="budget">{t('max_budget')}</Label>
              <Input
                id="budget"
                type="number"
                min={0}
                placeholder={t('no_limit')}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
            <Label className="flex items-center gap-2">
              <Checkbox checked={scholarshipOnly} onCheckedChange={(c) => setScholarshipOnly(!!c)} />
              {t('scholarship_only')}
            </Label>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" disabled={step === 1 || busy} onClick={() => setStep(step - 1)}>
            Back
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={busy}>Next</Button>
          ) : (
            <Button onClick={finish} disabled={busy}>{t('finish')}</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
