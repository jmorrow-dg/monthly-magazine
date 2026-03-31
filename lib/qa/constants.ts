// ============================================================
// QA Engine Constants
// ============================================================

import type { QACheckCategory } from '../types/qa';

/** Score weights per category (must total 100) */
export const SCORE_WEIGHTS: Record<QACheckCategory, number> = {
  factual_grounding: 25,
  citation_coverage: 20,
  numerical_accuracy: 15,
  structural_completeness: 10,
  editorial_compliance: 10,
  reasoning_validity: 10,
  derivative_consistency: 10,
};

/** Quality thresholds */
export const QA_THRESHOLDS = {
  /** 85+: publish ready, no editor intervention needed */
  PUBLISH_READY: 85,
  /** 70-84: editor review recommended before publish */
  EDITOR_REVIEW: 70,
  /** Below 70: publish blocked */
  BLOCKED: 70,
  /** Default threshold applied for pass/fail */
  DEFAULT: 70,
} as const;

/** Australian English spelling corrections (US to AU) */
export const AU_SPELLING_MAP: Record<string, string> = {
  organize: 'organise',
  organization: 'organisation',
  organizations: 'organisations',
  organizational: 'organisational',
  optimize: 'optimise',
  optimization: 'optimisation',
  optimized: 'optimised',
  optimizing: 'optimising',
  analyze: 'analyse',
  analyzing: 'analysing',
  analyzed: 'analysed',
  analysis: 'analysis', // same in both
  utilize: 'utilise',
  utilized: 'utilised',
  utilizing: 'utilising',
  utilization: 'utilisation',
  recognize: 'recognise',
  recognized: 'recognised',
  recognizing: 'recognising',
  customize: 'customise',
  customized: 'customised',
  customizing: 'customising',
  customization: 'customisation',
  prioritize: 'prioritise',
  prioritized: 'prioritised',
  prioritizing: 'prioritising',
  prioritization: 'prioritisation',
  modernize: 'modernise',
  modernized: 'modernised',
  modernizing: 'modernising',
  modernization: 'modernisation',
  centralize: 'centralise',
  centralized: 'centralised',
  centralizing: 'centralising',
  centralization: 'centralisation',
  standardize: 'standardise',
  standardized: 'standardised',
  standardizing: 'standardising',
  standardization: 'standardisation',
  minimize: 'minimise',
  minimized: 'minimised',
  minimizing: 'minimising',
  maximize: 'maximise',
  maximized: 'maximised',
  maximizing: 'maximising',
  specialise: 'specialise',
  specialize: 'specialise',
  specialized: 'specialised',
  specializing: 'specialising',
  specialization: 'specialisation',
  digitize: 'digitise',
  digitized: 'digitised',
  digitizing: 'digitising',
  digitization: 'digitisation',
  stabilize: 'stabilise',
  stabilized: 'stabilised',
  stabilizing: 'stabilising',
  stabilization: 'stabilisation',
  monetize: 'monetise',
  monetized: 'monetised',
  monetizing: 'monetising',
  monetization: 'monetisation',
  color: 'colour',
  colors: 'colours',
  favor: 'favour',
  favors: 'favours',
  favorable: 'favourable',
  labor: 'labour',
  behavior: 'behaviour',
  behaviors: 'behaviours',
  behavioral: 'behavioural',
  neighbor: 'neighbour',
  neighbors: 'neighbours',
  defense: 'defence',
  offense: 'offence',
  license: 'licence',
  practice: 'practise', // verb form
  catalog: 'catalogue',
  dialog: 'dialogue',
  program: 'programme', // non-computer context
  center: 'centre',
  centers: 'centres',
  meter: 'metre',
  liter: 'litre',
  fiber: 'fibre',
};

/** Minimum item counts per section for structural completeness */
export const REQUIRED_SECTIONS: Record<string, { minItems: number; label: string }> = {
  cover_story_json: { minItems: 1, label: 'Cover Story' },
  implications_json: { minItems: 3, label: 'Strategic Implications' },
  enterprise_json: { minItems: 3, label: 'Enterprise Spotlight' },
  industry_watch_json: { minItems: 3, label: 'Industry Watch' },
  tools_json: { minItems: 3, label: 'Tools & Platforms' },
  playbooks_json: { minItems: 2, label: 'Playbooks' },
  strategic_signals_json: { minItems: 3, label: 'Strategic Signals' },
  briefing_prompts_json: { minItems: 3, label: 'Briefing Prompts' },
  executive_briefing_json: { minItems: 3, label: 'Executive Briefing' },
  editorial_note: { minItems: 1, label: 'Editorial Note' },
  why_this_matters: { minItems: 1, label: 'Why This Matters' },
};

/** Required fields per cover story */
export const COVER_STORY_REQUIRED_FIELDS = [
  'headline',
  'subheadline',
  'introduction',
  'analysis',
  'strategic_implications',
] as const;

/** Word count overage thresholds */
export const OVERAGE_THRESHOLDS = {
  /** Over 120% of max = error */
  ERROR_PCT: 1.2,
  /** Over 100% of max = warning */
  WARNING_PCT: 1.0,
} as const;
