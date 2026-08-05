import { useI18n } from '../../i18n';
import type { Locale } from '../../i18n/dict';
import type { EducationStop } from '../../education/types';

export interface DepthRulerProps {
  stops: readonly EducationStop[];
  activeStopId: string;
  onSelect?: (stopId: string) => void;
}

export function getDepthLabel(depthMeters: number, locale: Locale): string {
  const useKilometers = Math.abs(depthMeters) >= 1000;
  const value = useKilometers ? depthMeters / 1000 : depthMeters;
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1,
  });

  return `${formatter.format(value)} ${useKilometers ? 'km' : 'm'}`;
}

export function DepthRuler({ stops, activeStopId, onSelect }: DepthRulerProps) {
  const { locale } = useI18n();

  return (
    <nav className="flex w-full min-w-0 flex-col gap-2 py-1">
      <ol className="flex w-full min-w-0 list-none flex-col gap-2">
        {stops.map((stop) => {
          const isActive = stop.id === activeStopId;
          const depthLabel = getDepthLabel(stop.depthMeters, locale);
          const title = `${stop.title[locale]} (${depthLabel})`;

          return (
            <li key={stop.id} className="min-w-0">
              <button
                type="button"
                title={title}
                aria-current={isActive ? 'step' : undefined}
                data-layer={stop.layer}
                data-active={isActive}
                onClick={() => onSelect?.(stop.id)}
                className={[
                  'flex min-h-11 w-full min-w-0 max-w-full items-center gap-3 rounded-full border px-4 py-2 text-left transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
                  isActive
                    ? 'border-ink bg-ink text-paper'
                    : 'border-ink/15 bg-paper text-ink hover:border-ink/40 hover:bg-ink/5',
                ].join(' ')}
              >
                <span className="min-w-0 flex-1 text-sm font-medium leading-tight [overflow-wrap:anywhere]">
                  {stop.title[locale]}
                </span>
                <span className="shrink-0 text-right font-mono text-xs uppercase tracking-[0.18em]">
                  {depthLabel}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
