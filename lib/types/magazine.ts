import type { IssueFormat } from './issue';

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

// ── Monthly/Quarterly layout (22 pages, 12 spreads) ──────────────

export const MONTHLY_SPREAD_LAYOUT: SpreadConfig[] = [
  { spreadIndex: 0,  leftPageNumber: 1,  rightPageNumber: null },  // Cover (single)
  { spreadIndex: 1,  leftPageNumber: 2,  rightPageNumber: 3 },    // Editorial + Executive Briefing
  { spreadIndex: 2,  leftPageNumber: 4,  rightPageNumber: 5 },    // Global Landscape + Why This Matters
  { spreadIndex: 3,  leftPageNumber: 6,  rightPageNumber: 7 },    // Section Divider (Cover Story) + Cover Story Intro
  { spreadIndex: 4,  leftPageNumber: 8,  rightPageNumber: 9 },    // Cover Story Analysis + Cover Story Implications
  { spreadIndex: 5,  leftPageNumber: 10, rightPageNumber: 11 },   // Strategic Implications + Adoption Curve
  { spreadIndex: 6,  leftPageNumber: 12, rightPageNumber: 13 },   // AI-Native Org + Capability Stack
  { spreadIndex: 7,  leftPageNumber: 14, rightPageNumber: 15 },   // Enterprise + Adoption Map
  { spreadIndex: 8,  leftPageNumber: 16, rightPageNumber: 17 },   // Briefing Prompts + Tools + Industry Watch
  { spreadIndex: 9,  leftPageNumber: 18, rightPageNumber: 19 },   // Section Divider (Playbooks) + All 3 Playbooks
  { spreadIndex: 10, leftPageNumber: 20, rightPageNumber: 21 },   // Transformation Pathway + Strategic Signals
  { spreadIndex: 11, leftPageNumber: 22, rightPageNumber: null },  // D&G Closing (single)
];

export const MONTHLY_TOTAL_PAGES = 22;

export const MONTHLY_PAGE_LABELS = [
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
  'Briefing Prompts + Toolkit',     // 16
  'Industry Watch',                 // 17
  'Operator Playbooks',             // 18 (divider)
  'Operator Playbooks',             // 19
  'Transformation Pathway',         // 20
  'Strategic Signals',              // 21
  'David & Goliath',                // 22 (closing)
] as const;

// ── Weekly layout (10 pages, 6 spreads) ──────────────────────────

export const WEEKLY_SPREAD_LAYOUT: SpreadConfig[] = [
  { spreadIndex: 0, leftPageNumber: 1,  rightPageNumber: null },  // Cover (single)
  { spreadIndex: 1, leftPageNumber: 2,  rightPageNumber: 3 },    // Contents + Editorial | Lead Story
  { spreadIndex: 2, leftPageNumber: 4,  rightPageNumber: 5 },    // Key Signals | Strategic Implications
  { spreadIndex: 3, leftPageNumber: 6,  rightPageNumber: 7 },    // Enterprise + Industry | Executive Briefing
  { spreadIndex: 4, leftPageNumber: 8,  rightPageNumber: 9 },    // Operator's Toolkit | Strategic Outlook
  { spreadIndex: 5, leftPageNumber: 10, rightPageNumber: null },  // Closing (single)
];

export const WEEKLY_TOTAL_PAGES = 10;

export const WEEKLY_PAGE_LABELS = [
  'Cover',                          // 1
  'This Week + Editorial',          // 2
  'Lead Story',                     // 3
  'Key Signals',                    // 4
  'Strategic Implications',         // 5
  'Enterprise + Industry',          // 6
  'Executive Briefing',             // 7
  "Operator's Toolkit",             // 8
  'Strategic Outlook',              // 9
  'David & Goliath',                // 10 (closing)
] as const;

// ── Format-aware helpers ─────────────────────────────────────────

export function getSpreadLayout(format: IssueFormat): SpreadConfig[] {
  return format === 'weekly' ? WEEKLY_SPREAD_LAYOUT : MONTHLY_SPREAD_LAYOUT;
}

export function getTotalPages(format: IssueFormat): number {
  return format === 'weekly' ? WEEKLY_TOTAL_PAGES : MONTHLY_TOTAL_PAGES;
}

export function getTotalSpreads(format: IssueFormat): number {
  return getSpreadLayout(format).length;
}

export function getPageLabels(format: IssueFormat): readonly string[] {
  return format === 'weekly' ? WEEKLY_PAGE_LABELS : MONTHLY_PAGE_LABELS;
}

// Backward-compatible aliases for existing code
export const SPREAD_LAYOUT = MONTHLY_SPREAD_LAYOUT;
export const TOTAL_PAGES = MONTHLY_TOTAL_PAGES;
export const TOTAL_SPREADS = MONTHLY_SPREAD_LAYOUT.length;
export const PAGE_LABELS = MONTHLY_PAGE_LABELS;
