import type { CSSProperties } from 'react';
import type { EducationLayer } from '../../education/types';

export interface LayerBandProps {
  layer: EducationLayer;
  active: boolean;
  progress: number;
}

const LAYER_TOKENS: Record<EducationLayer, string> = {
  surface: 'layer-surface border-ink/35 bg-ink/5',
  soil: 'layer-soil border-ink/25 bg-ink/10',
  groundwater: 'layer-groundwater border-ink/30 bg-ink/12',
  underground: 'layer-underground border-ink/20 bg-ink/15',
  crust: 'layer-crust border-ink/30 bg-ink/10',
  mantle: 'layer-mantle border-ink/35 bg-ink/15',
  core: 'layer-core border-ink/45 bg-ink/20',
};

export function getLayerToken(layer: EducationLayer): string {
  return LAYER_TOKENS[layer];
}

export function LayerBand({ layer, active, progress }: LayerBandProps) {
  const normalizedProgress = Math.max(0, Math.min(1, progress));
  const style = {
    '--layer-progress': String(normalizedProgress),
  } as CSSProperties & Record<'--layer-progress', string>;

  return (
    <section
      data-layer={layer}
      data-active={active}
      style={style}
      className={[
        'relative isolate overflow-hidden rounded-[1.75rem] border',
        'min-h-24 w-full',
        active ? 'ring-1 ring-ink/60' : 'opacity-80',
        getLayerToken(layer),
      ].join(' ')}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 origin-bottom bg-ink/12 transition-transform motion-reduce:transition-none"
        style={{ transform: 'scaleY(var(--layer-progress))' }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px bg-ink/55"
        style={{ transform: 'translateY(calc((1 - var(--layer-progress)) * -100%))' }}
      />
    </section>
  );
}
