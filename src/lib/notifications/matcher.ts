import { createAdminClient } from '@/lib/supabase/admin';
import type { Opportunity, Profile } from '@/types/domain';
import { ageRangeBounds, toUsd } from '@/lib/utils';
import { INTEREST_TO_CATEGORIES, type Interest } from '@/types/domain';

// Find profiles whose preferences match the opportunity, then queue email/push rows.
export async function queueNotificationsForOpportunity(opportunityId: string) {
  const supabase = createAdminClient();
  const { data: opp } = await supabase.from('opportunities').select('*').eq('id', opportunityId).single();
  if (!opp || opp.status !== 'active') return;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .or('notify_email.eq.true,notify_push.eq.true');

  const matched = (profiles ?? []).filter((p) => matches(opp, p));

  for (const p of matched) {
    if (p.notify_email) {
      await supabase
        .from('notifications')
        .insert({ profile_id: p.id, opportunity_id: opp.id, type: 'new_match', channel: 'email' });
    }
    if (p.notify_push && p.push_subscription) {
      await supabase
        .from('notifications')
        .insert({ profile_id: p.id, opportunity_id: opp.id, type: 'new_match', channel: 'push' });
    }
  }
}

export function matches(opp: Opportunity, profile: Profile): boolean {
  // Age overlap (only if user provided a range AND opp constrains age)
  const userAge = ageRangeBounds(profile.age_range);
  if (userAge && (opp.age_min != null || opp.age_max != null)) {
    const oppMin = opp.age_min ?? 0;
    const oppMax = opp.age_max ?? 120;
    if (userAge[1] < oppMin || userAge[0] > oppMax) return false;
  }

  // Language overlap
  if (opp.languages.length > 0 && profile.languages.length > 0) {
    const overlap = opp.languages.some((l) => profile.languages.includes(l));
    if (!overlap) return false;
  }

  // Scholarship-only filter
  if (profile.scholarship_only && !(opp.is_free || opp.has_scholarship)) return false;

  // Budget filter
  if (profile.max_budget_usd != null && !opp.is_free) {
    const usd = toUsd(opp.cost_amount, opp.cost_currency);
    if (usd != null && usd > profile.max_budget_usd) return false;
  }

  // Interest → category mapping (if user picked any interests)
  if (profile.interests.length > 0 && opp.category) {
    const allowed = new Set<string>();
    for (const i of profile.interests as Interest[]) {
      const cats = INTEREST_TO_CATEGORIES[i];
      if (cats) cats.forEach((c) => allowed.add(c));
    }
    if (!allowed.has(opp.category)) return false;
  }

  return true;
}

// Top N opportunities ranked for a single profile (used on the onboarding finish page).
export async function rankForProfile(profileId: string, limit = 5): Promise<Opportunity[]> {
  const supabase = createAdminClient();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', profileId).single();
  if (!profile) return [];

  const { data: opps } = await supabase
    .from('opportunities')
    .select('*')
    .eq('status', 'active')
    .order('discovered_at', { ascending: false })
    .limit(200);

  const matched = (opps ?? []).filter((o) => matches(o, profile));
  // Prefer recommended, then nearest deadline, then newest.
  matched.sort((a, b) => {
    if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
    if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return new Date(b.discovered_at).getTime() - new Date(a.discovered_at).getTime();
  });
  return matched.slice(0, limit);
}
