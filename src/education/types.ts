export type EducationCategory = 'life' | 'human' | 'geology' | 'tech';

export type EducationLayer =
  | 'surface'
  | 'soil'
  | 'groundwater'
  | 'underground'
  | 'crust'
  | 'mantle'
  | 'core';

export interface EducationSource {
  label: string;
  url: string;
}

export interface EducationVisual {
  kind: string;
  label: string;
}

export interface EducationStop {
  id: string;
  depthMeters: number;
  layer: EducationLayer;
  category: EducationCategory;
  title: { id: string; en: string };
  fact: { id: string; en: string };
  comparison: { id: string; en: string };
  source: EducationSource;
  visual: EducationVisual;
}
