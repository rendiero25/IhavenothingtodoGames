export type EducationCategory = 'life' | 'human' | 'geology' | 'tech';

export type EducationLayer =
  | 'surface'
  | 'soil'
  | 'groundwater'
  | 'underground'
  | 'crust'
  | 'mantle'
  | 'core';

export interface EducationLocalizedText {
  id: string;
  en: string;
}

export interface EducationSource {
  label: string;
  url: string;
}

export interface EducationVisual {
  kind: string;
  label: EducationLocalizedText;
}

export interface EducationStop {
  id: string;
  depthMeters: number;
  layer: EducationLayer;
  category: EducationCategory;
  title: EducationLocalizedText;
  fact: EducationLocalizedText;
  comparison: EducationLocalizedText;
  source: EducationSource;
  visual: EducationVisual;
}
