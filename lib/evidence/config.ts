// ============================================================
// Intelligence Accuracy Engine: Configuration
// Section-category mappings, ranking weights, and limits.
// ============================================================

import type { MagazineSectionName } from '@/lib/types/evidence';

// ── Section to signal category mapping ─────────────────────

/**
 * Maps each magazine section to the signal categories most relevant to it.
 * Categories listed first have higher alignment weight.
 */
export const SECTION_CATEGORY_MAP: Record<MagazineSectionName, string[]> = {
  cover_story: ['Model Releases', 'Agent Systems', 'Enterprise AI', 'AI Strategy', 'AI Infrastructure', 'AI Security'],
  implications: ['AI Strategy', 'Enterprise AI', 'Agent Systems'],
  enterprise: ['Enterprise AI', 'AI Infrastructure'],
  industry_watch: ['Enterprise AI', 'AI Infrastructure', 'Agent Systems'],
  tools: ['Agent Systems', 'AI Infrastructure', 'Model Releases'],
  playbooks: ['AI Strategy', 'Enterprise AI', 'Agent Systems'],
  strategic_signals: ['AI Strategy', 'AI Security', 'Agent Systems'],
  briefing_prompts: ['AI Strategy', 'Enterprise AI'],
  executive_briefing: ['AI Strategy', 'Enterprise AI'],
  ai_native_org: ['Enterprise AI', 'AI Strategy', 'Agent Systems'],
  editorial: ['AI Strategy', 'Enterprise AI'],
  why_this_matters: ['AI Strategy', 'Enterprise AI'],
  regional_signals: ['Enterprise AI', 'AI Infrastructure', 'AI Strategy'],
  global_landscape: ['Enterprise AI', 'AI Infrastructure', 'AI Strategy'],
};

/**
 * Maps cluster_type values to corresponding section names.
 */
export const CLUSTER_TYPE_TO_SECTION: Record<string, MagazineSectionName> = {
  cover_story: 'cover_story',
  implications: 'implications',
  enterprise: 'enterprise',
  industry_watch: 'industry_watch',
  strategic_signals: 'strategic_signals',
};

// ── Ranking configuration ──────────────────────────────────

export interface EvidenceRankingConfig {
  weights: {
    category_alignment: number;
    composite_score: number;
    cluster_membership: number;
    trend_alignment: number;
    recency_bias: number;
  };
  min_relevance_threshold: number;
}

export interface EvidenceConfig {
  ranking: EvidenceRankingConfig;
  max_items_per_section: Record<MagazineSectionName, number>;
}

export const DEFAULT_EVIDENCE_CONFIG: EvidenceConfig = {
  ranking: {
    weights: {
      category_alignment: 0.35,
      composite_score: 0.25,
      cluster_membership: 0.20,
      trend_alignment: 0.10,
      recency_bias: 0.10,
    },
    min_relevance_threshold: 0.15,
  },
  max_items_per_section: {
    cover_story: 10,
    implications: 8,
    enterprise: 8,
    industry_watch: 8,
    tools: 6,
    playbooks: 6,
    strategic_signals: 6,
    briefing_prompts: 6,
    executive_briefing: 6,
    ai_native_org: 6,
    editorial: 4,
    why_this_matters: 4,
    regional_signals: 6,
    global_landscape: 8,
  },
};
