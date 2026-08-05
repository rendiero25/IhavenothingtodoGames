import type { EducationCategory, EducationSource, EducationStop } from '../../education/types';
import type { DictKey } from '../../i18n/dict';
import { useI18n } from '../../i18n';
import { getCategoryToken } from './ObjectScene';

export interface DiscoveryCardProps {
  stop: EducationStop;
}

const CATEGORY_LABEL_KEYS = {
  life: 'education.category.life',
  human: 'education.category.human',
  geology: 'education.category.geology',
  tech: 'education.category.tech',
} as const satisfies Record<EducationCategory, DictKey>;

export function formatSourceLabel(source: EducationSource): string {
  const trimmed = source.label.trim();
  if (trimmed.length > 0) return trimmed;

  try {
    return new URL(source.url).hostname.replace(/^www\./, '');
  } catch {
    return source.url.trim() || '—';
  }
}

function formatDepth(depthMeters: number, locale: 'id' | 'en') {
  const formatter = new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    maximumFractionDigits: depthMeters < 10 ? 1 : 0,
  });

  return `${formatter.format(depthMeters)} m`;
}

export function DiscoveryCard({ stop }: DiscoveryCardProps) {
  const { locale, t } = useI18n();
  const categoryLabel = t(CATEGORY_LABEL_KEYS[stop.category]);
  const depthLabel = t('education.label.depth');
  const comparisonLabel = t('education.label.comparison');
  const sourceLabel = t('education.label.source');
  const sourceText = formatSourceLabel(stop.source);
  const categoryToken = getCategoryToken(stop.category);

  return (
    <article
      className="rounded-[2rem] border border-current/20 bg-paper p-5 text-ink"
      data-category-token={categoryToken}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink/68">{categoryLabel}</p>
          <h3 className="text-balance font-geist text-2xl leading-tight">{stop.title[locale]}</h3>
        </div>
        <p className="rounded-full border border-current/20 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink/76">
          {depthLabel} {formatDepth(stop.depthMeters, locale)}
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <p className="text-sm leading-6 text-ink/88">{stop.fact[locale]}</p>
        <div className="space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink/62">{comparisonLabel}</p>
          <p className="text-sm leading-6 text-ink/88">{stop.comparison[locale]}</p>
        </div>
        <a
          href={stop.source.url}
          className="inline-flex rounded-full border border-current/20 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {sourceLabel} {sourceText}
        </a>
      </div>
    </article>
  );
}
