import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t bg-muted/30 py-8">
      <div className="container flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground sm:flex-row">
        <p>{t('tagline')}</p>
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>© {year} Kesher</span>
          <span aria-hidden>·</span>
          <span>{t('built_by')} <span className="font-medium text-foreground">נוגה פינקלשטיין</span></span>
          <span aria-hidden>·</span>
          <span>{t('rights')}</span>
        </p>
      </div>
    </footer>
  );
}
