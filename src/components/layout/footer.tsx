import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t bg-muted/30 py-8">
      <div className="container flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground sm:flex-row">
        <p>{t('tagline')}</p>
        <p>© {year} Kesher. {t('rights')}</p>
      </div>
    </footer>
  );
}
