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
  { spreadIndex: 0, leftPageNumber: 1, rightPageNumber: null },   // Cover
  { spreadIndex: 1, leftPageNumber: 2, rightPageNumber: 3 },      // Editorial + Why This Matters
  { spreadIndex: 2, leftPageNumber: 4, rightPageNumber: 5 },      // Section Divider (Cover Story) + Cover Story Intro
  { spreadIndex: 3, leftPageNumber: 6, rightPageNumber: 7 },      // Cover Story Analysis + Implications
  { spreadIndex: 4, leftPageNumber: 8, rightPageNumber: 9 },      // Strategic Implications + Enterprise
  { spreadIndex: 5, leftPageNumber: 10, rightPageNumber: 11 },    // Industry Watch + Tools
  { spreadIndex: 6, leftPageNumber: 12, rightPageNumber: 13 },    // Section Divider (Playbooks) + Operator Playbook
  { spreadIndex: 7, leftPageNumber: 14, rightPageNumber: 15 },    // Playbook Continued + Strategic Signals
  { spreadIndex: 8, leftPageNumber: 16, rightPageNumber: null },   // Closing
];

export const TOTAL_PAGES = 16;
export const TOTAL_SPREADS = SPREAD_LAYOUT.length;

export const PAGE_LABELS = [
  'Cover',
  'Editorial Note',
  'Why This Matters',
  'Cover Story',
  'Cover Story',
  'Cover Story (Analysis)',
  'Cover Story (Implications)',
  'Strategic Implications',
  'Enterprise AI',
  'Industry Watch',
  'Tools',
  'Operator Playbooks',
  'Operator Playbook',
  'Operator Playbook (Continued)',
  'Strategic Signals',
  'Closing',
] as const;
