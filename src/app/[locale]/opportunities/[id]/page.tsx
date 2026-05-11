import { notFound } from 'next/navigation';
import Image from 'next/image';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeadlineBadge } from '@/components/deadline-badge';
import { SaveButton } from '@/components/save-button';
import { ExternalLink, MapPin, Clock, Globe } from 'lucide-react';
import { localized } from '@/types/domain';
import type { Locale } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

export default async function OpportunityDetail({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('opportunity');
  const tCat = await getTranslations('categories');

  const supabase = await createClient();
  const { data: opp } = await supabase
    .from('opportunities')
    .select('*, sources(name, url)')
    .eq('id', id)
    .single();
  if (!opp || opp.status !== 'active') notFound();

  const title = localized(opp, 'title', locale);
  const description = localized(opp, 'description', locale);
  const sourceName = (opp as any).sources?.name as string | undefined;

  return (
    <article className="container max-w-4xl py-8">
      {opp.recommended && (
        <div className="mb-6 rounded-lg border-2 border-brand-sand bg-brand-cream p-4">
          <p className="font-semibold text-brand-deep">⭐ {t('recommended_banner')}</p>
          {opp.recommended_note && <p className="mt-1 text-sm text-brand-deep/80">{opp.recommended_note}</p>}
        </div>
      )}

      {opp.image_url && (
        <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-lg bg-muted">
          <Image src={opp.image_url} alt="" fill sizes="(max-width:1024px) 100vw, 1024px" className="object-cover" unoptimized />
        </div>
      )}

      <header className="space-y-3">
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
        {sourceName && <p className="text-sm text-muted-foreground">{t('from_source', { source: sourceName })}</p>}
        <div className="flex flex-wrap gap-2">
          {opp.category && <Badge variant="outline">{tCat(opp.category as any)}</Badge>}
          <DeadlineBadge deadline={opp.deadline} />
          {opp.is_free && <Badge variant="success">{t('free')}</Badge>}
          {opp.has_scholarship && !opp.is_free && <Badge variant="secondary">{t('scholarship')}</Badge>}
          {opp.age_min != null && opp.age_max != null && (
            <Badge variant="muted">{t('ages', { min: opp.age_min, max: opp.age_max })}</Badge>
          )}
        </div>
      </header>

      <section className="prose prose-slate mt-6 max-w-none whitespace-pre-line dark:prose-invert">
        {description}
      </section>

      <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {opp.location && (
          <Detail icon={<MapPin className="h-4 w-4" />} label={t('location')} value={opp.location} />
        )}
        {opp.duration_text && (
          <Detail icon={<Clock className="h-4 w-4" />} label={t('duration')} value={opp.duration_text} />
        )}
        {opp.languages.length > 0 && (
          <Detail icon={<Globe className="h-4 w-4" />} label={t('languages')} value={opp.languages.join(', ')} />
        )}
        {opp.start_date && (
          <Detail label={t('starts')} value={new Date(opp.start_date).toLocaleDateString(locale)} />
        )}
        {opp.end_date && (
          <Detail label={t('ends')} value={new Date(opp.end_date).toLocaleDateString(locale)} />
        )}
        {opp.cost_amount && opp.cost_amount > 0 && (
          <Detail label="Cost" value={`${opp.cost_amount} ${opp.cost_currency ?? ''}`.trim()} />
        )}
      </dl>

      <div className="sticky bottom-0 mt-8 flex flex-wrap gap-3 border-t bg-background/95 py-4 backdrop-blur md:static md:border-0 md:py-0">
        <SaveButton opportunityId={opp.id} />
        <Button asChild>
          <a href={opp.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {t('visit_official')}
          </a>
        </Button>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'EducationalOccupationalProgram',
            name: title,
            description,
            url: opp.url,
            provider: sourceName ? { '@type': 'Organization', name: sourceName } : undefined,
            applicationDeadline: opp.deadline,
            startDate: opp.start_date,
            endDate: opp.end_date,
            educationalProgramMode: opp.location?.toLowerCase() === 'online' ? 'online' : 'onsite',
            offers: opp.cost_amount
              ? { '@type': 'Offer', price: opp.cost_amount, priceCurrency: opp.cost_currency ?? 'USD' }
              : opp.is_free
                ? { '@type': 'Offer', price: 0, priceCurrency: 'USD' }
                : undefined,
          }),
        }}
      />
    </article>
  );
}

function Detail({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div>
        <dt className="font-medium text-muted-foreground">{label}</dt>
        <dd>{value}</dd>
      </div>
    </div>
  );
}
