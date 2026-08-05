import type { CSSProperties } from 'react';
import type { EducationLayer } from '../../education/types';

export interface LayerBandProps {
  layer: EducationLayer;
  active: boolean;
  progress: number;
}

const LAYER_TOKENS: Record<EducationLayer, string> = {
  surface: 'layer-surface border-white/35 bg-white/8',
  soil: 'layer-soil border-white/25 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.12)_0_10px,transparent_10px_20px)]',
  groundwater:
    'layer-groundwater border-white/30 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.1)_0_6px,transparent_6px_12px)]',
  underground:
    'layer-underground border-white/20 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.08)_0_12px,transparent_12px_24px)]',
  crust: 'layer-crust border-white/30 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_55%)]',
  mantle:
    'layer-mantle border-white/35 bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.14)_0_8px,transparent_8px_16px)]',
  core: 'layer-core border-white/45 bg-[radial-gradient(circle,rgba(255,255,255,0.22),transparent_65%)]',
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
        active ? 'ring-1 ring-white/60' : 'opacity-80',
        getLayerToken(layer),
      ].join(' ')}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 origin-bottom bg-white/12 transition-transform motion-reduce:transition-none"
        style={{ transform: 'scaleY(var(--layer-progress))' }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px bg-white/55"
        style={{ transform: 'translateY(calc((1 - var(--layer-progress)) * -100%))' }}
      />
    </section>
  );
}
