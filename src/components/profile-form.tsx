'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/domain';
import { PushSetup } from './push-setup';

const AGE_RANGES = ['13-17', '18-22', '23-30', '31-45', '46+'];
const KNOWN_LANGS = [
  { code: 'en', label: 'English' },
  { code: 'pl', label: 'Polski' },
  { code: 'he', label: 'עברית' },
  { code: 'ru', label: 'Русский' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
];
const INTERESTS = ['religious', 'academic', 'volunteer', 'cultural', 'professional'];

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const t = useTranslations('profile');
  const tInt = useTranslations('interests');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [ageRange, setAgeRange] = useState(profile?.age_range ?? '23-30');
  const [locale, setLocale] = useState(profile?.locale ?? 'en');
  const [languages, setLanguages] = useState<string[]>(profile?.languages ?? ['en']);
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [budget, setBudget] = useState(profile?.max_budget_usd?.toString() ?? '');
  const [scholarshipOnly, setScholarshipOnly] = useState(profile?.scholarship_only ?? false);
  const [notifyEmail, setNotifyEmail] = useState(profile?.notify_email ?? true);
  const [notifyPush, setNotifyPush] = useState(profile?.notify_push ?? false);

  function toggle(arr: string[], v: string) {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  async function save() {
    setBusy(true);
    setSaved(false);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('profiles')
      .update({
        full_name: fullName || null,
        age_range: ageRange as any,
        locale: locale as any,
        languages,
        interests,
        max_budget_usd: budget ? parseInt(budget, 10) : null,
        scholarship_only: scholarshipOnly,
        notify_email: notifyEmail,
        notify_push: notifyPush,
      })
      .eq('id', user.id);
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function deleteAccount() {
    if (!confirm(t('delete_confirm'))) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Profile row cascades from auth.users delete; we can only sign out from client.
    // Full deletion requires a server route with service role; queued here as a best effort.
    await fetch('/api/profile/delete', { method: 'POST' });
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('personal_info')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Age range</Label>
              <Select value={ageRange ?? ''} onValueChange={setAgeRange as any}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{AGE_RANGES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Interface language</Label>
              <Select value={locale ?? 'en'} onValueChange={setLocale as any}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="he">עברית</SelectItem>
                  <SelectItem value="pl">Polski</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('preferences')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Languages you understand</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {KNOWN_LANGS.map((l) => (
                <Label key={l.code} className="flex items-center gap-2">
                  <Checkbox checked={languages.includes(l.code)} onCheckedChange={() => setLanguages(toggle(languages, l.code))} />
                  {l.label}
                </Label>
              ))}
            </div>
          </div>
          <div>
            <Label>Interests</Label>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {INTERESTS.map((i) => (
                <Label key={i} className="flex items-center gap-2">
                  <Checkbox checked={interests.includes(i)} onCheckedChange={() => setInterests(toggle(interests, i))} />
                  {tInt(i as any)}
                </Label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Max budget (USD)</Label>
            <Input id="budget" type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
          <Label className="flex items-center gap-2">
            <Checkbox checked={scholarshipOnly} onCheckedChange={(c) => setScholarshipOnly(!!c)} />
            Only show free or with scholarship
          </Label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('notifications')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label className="flex items-center justify-between">
            <span>{t('notify_email')}</span>
            <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />
          </Label>
          <Label className="flex items-center justify-between">
            <span>{t('notify_push')}</span>
            <Switch checked={notifyPush} onCheckedChange={setNotifyPush} />
          </Label>
          {notifyPush && <PushSetup />}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={busy}>{busy ? '...' : 'Save'}</Button>
        {saved && <span className="text-sm text-emerald-600">{t('saved_changes')}</span>}
      </div>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">{t('danger_zone')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={deleteAccount}>{t('delete_account')}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
