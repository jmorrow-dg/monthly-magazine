export type ContentLimit = {
  maxChars: number;
  maxWords: number;
  warnWords: number;
};

/**
 * Content limits per section per field, derived from A4 template constraints.
 * Fields not listed here have no indicator (e.g. select, string-array).
 */
export const CONTENT_LIMITS: Record<string, Record<string, ContentLimit>> = {
  cover_story: {
    headline: { maxChars: 200, maxWords: 20, warnWords: 15 },
    subheadline: { maxChars: 300, maxWords: 35, warnWords: 25 },
    introduction: { maxChars: 3000, maxWords: 500, warnWords: 400 },
    analysis: { maxChars: 4000, maxWords: 650, warnWords: 550 },
    strategic_implications: { maxChars: 3000, maxWords: 500, warnWords: 400 },
  },
  implications: {
    title: { maxChars: 200, maxWords: 20, warnWords: 15 },
    description: { maxChars: 500, maxWords: 80, warnWords: 60 },
  },
  enterprise: {
    title: { maxChars: 200, maxWords: 20, warnWords: 15 },
    description: { maxChars: 500, maxWords: 80, warnWords: 60 },
    industry: { maxChars: 100, maxWords: 5, warnWords: 4 },
  },
  industry_watch: {
    industry: { maxChars: 100, maxWords: 5, warnWords: 4 },
    headline: { maxChars: 200, maxWords: 20, warnWords: 15 },
    description: { maxChars: 500, maxWords: 80, warnWords: 60 },
  },
  tools: {
    name: { maxChars: 100, maxWords: 8, warnWords: 6 },
    description: { maxChars: 300, maxWords: 40, warnWords: 30 },
    verdict: { maxChars: 200, maxWords: 25, warnWords: 18 },
  },
  playbooks: {
    title: { maxChars: 200, maxWords: 15, warnWords: 10 },
    context: { maxChars: 300, maxWords: 30, warnWords: 22 },
    outcome: { maxChars: 300, maxWords: 20, warnWords: 15 },
  },
  strategic_signals: {
    signal: { maxChars: 200, maxWords: 20, warnWords: 15 },
    context: { maxChars: 300, maxWords: 50, warnWords: 40 },
    implication: { maxChars: 300, maxWords: 50, warnWords: 40 },
  },
};

/** Limits for cover + editorial + template fields (used inline in the editor page). */
export const INLINE_LIMITS: Record<string, ContentLimit> = {
  cover_headline: { maxChars: 200, maxWords: 15, warnWords: 10 },
  cover_subtitle: { maxChars: 200, maxWords: 25, warnWords: 18 },
  editorial_note: { maxChars: 5000, maxWords: 300, warnWords: 250 },
  why_this_matters: { maxChars: 5000, maxWords: 300, warnWords: 250 },
};
