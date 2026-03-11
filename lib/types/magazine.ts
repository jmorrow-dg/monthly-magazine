export type SpreadConfig = {
  spreadIndex: number;
  leftPageNumber: number | null;
  rightPageNumber: number | null;
};

export type ViewerMode = 'spread' | 'single';

export type MagazineViewerState = {
  currentSpread: number;
  totalSpreads: number;
  mode: ViewerMode;
  isTransitioning: boolean;
};

export const SPREAD_LAYOUT: SpreadConfig[] = [
  { spreadIndex: 0, leftPageNumber: 1, rightPageNumber: null },
  { spreadIndex: 1, leftPageNumber: 2, rightPageNumber: 3 },
  { spreadIndex: 2, leftPageNumber: 4, rightPageNumber: 5 },
  { spreadIndex: 3, leftPageNumber: 6, rightPageNumber: 7 },
  { spreadIndex: 4, leftPageNumber: 8, rightPageNumber: null },
];

export const TOTAL_PAGES = 8;
export const TOTAL_SPREADS = SPREAD_LAYOUT.length;
