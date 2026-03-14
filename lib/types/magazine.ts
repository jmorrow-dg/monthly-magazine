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
  { spreadIndex: 0,  leftPageNumber: 1,  rightPageNumber: null },  // Cover (single)
  { spreadIndex: 1,  leftPageNumber: 2,  rightPageNumber: 3 },    // Editorial + Executive Briefing
  { spreadIndex: 2,  leftPageNumber: 4,  rightPageNumber: 5 },    // Global Landscape + Why This Matters
  { spreadIndex: 3,  leftPageNumber: 6,  rightPageNumber: 7 },    // Section Divider (Cover Story) + Cover Story Intro
  { spreadIndex: 4,  leftPageNumber: 8,  rightPageNumber: 9 },    // Cover Story Analysis + Cover Story Implications
  { spreadIndex: 5,  leftPageNumber: 10, rightPageNumber: 11 },   // Strategic Implications + Adoption Curve
  { spreadIndex: 6,  leftPageNumber: 12, rightPageNumber: 13 },   // AI-Native Org + Capability Stack
  { spreadIndex: 7,  leftPageNumber: 14, rightPageNumber: 15 },   // Enterprise + Adoption Map
  { spreadIndex: 8,  leftPageNumber: 16, rightPageNumber: 17 },   // Briefing Prompts + Industry Watch
  { spreadIndex: 9,  leftPageNumber: 18, rightPageNumber: 19 },   // Tools + Section Divider (Playbooks)
  { spreadIndex: 10, leftPageNumber: 20, rightPageNumber: 21 },   // Operator Playbook + Transformation Pathway
  { spreadIndex: 11, leftPageNumber: 22, rightPageNumber: 23 },   // Playbook Continued + Strategic Signals
  { spreadIndex: 12, leftPageNumber: 24, rightPageNumber: null },  // D&G Closing (single)
];

export const TOTAL_PAGES = 24;
export const TOTAL_SPREADS = SPREAD_LAYOUT.length;

export const PAGE_LABELS = [
  'Cover',                          // 1
  'Editorial Note',                 // 2
  'Executive Briefing',             // 3
  'Global Landscape',               // 4
  'Why This Matters',               // 5
  'Cover Story',                    // 6 (divider)
  'Cover Story',                    // 7 (intro)
  'Cover Story (Analysis)',         // 8
  'Cover Story (Implications)',     // 9
  'Strategic Implications',         // 10
  'Adoption Curve',                 // 11
  'AI-Native Organisation',         // 12
  'Capability Stack',               // 13
  'Enterprise AI',                  // 14
  'Adoption Map',                   // 15
  'Operator Briefing Prompts',      // 16
  'Industry Watch',                 // 17
  'Tools Worth Watching',           // 18
  'Operator Playbooks',             // 19 (divider)
  'Operator Playbook',              // 20
  'Transformation Pathway',         // 21
  'Playbooks (Continued)',          // 22
  'Strategic Signals',              // 23
  'David & Goliath',                // 24 (closing)
] as const;
