// ============================================================
// Intelligence Hub Types
// Types for data received from the website intelligence API.
// ============================================================

export type SignalCategory =
  | 'Model Releases'
  | 'Agent Systems'
  | 'Enterprise AI'
  | 'AI Infrastructure'
  | 'AI Security'
  | 'AI Strategy';

export interface IntelligenceSignal {
  id: string;
  title: string;
  summary: string;
  source: string;
  source_url: string | null;
  signal_date: string;
  category: SignalCategory;
  tags: string[];
  what_happened: string | null;
  why_it_matters: string | null;
  who_should_care: string | null;
  practical_implication: string | null;
  company: string | null;
  topic: string | null;
  offer_alignment: string[];
  composite_score: number | null;
  status: string;
}

export interface SignalSummary {
  id: string;
  title: string;
  summary: string;
  why_it_matters: string | null;
  category: SignalCategory;
  composite_score: number | null;
  source: string;
  source_url: string | null;
}

export interface SignalFeedResponse {
  success: boolean;
  month_year: string;
  total: number;
  signals: IntelligenceSignal[];
  by_category: Record<string, IntelligenceSignal[]>;
}

export interface SignalSummaryResponse {
  success: boolean;
  signals: SignalSummary[];
  total: number;
}

export interface SignalCluster {
  id: string;
  title: string;
  theme: string;
  cluster_type: 'cover_story' | 'implications' | 'enterprise' | 'industry_watch' | 'strategic_signals' | 'general';
  signal_ids: string[];
  avg_composite_score: number | null;
  signal_count: number;
  month_year: string;
  narrative_summary: string | null;
}

export interface ClusterResponse {
  success: boolean;
  month_year: string;
  clusters: SignalCluster[];
  total: number;
}

// Trend Intelligence types (Phase 2)

export interface IntelligenceTrend {
  id: string;
  title: string;
  description: string;
  strategic_summary: string | null;
  implication_for_operators: string | null;
  region_scope: string[];
  sector_scope: string[];
  signal_type_scope: string[];
  confidence_score: number | null;
  signal_count: number;
  month_year: string;
  status: 'draft' | 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface TrendWithSignals extends IntelligenceTrend {
  signals: IntelligenceSignal[];
}

export interface TrendResponse {
  success: boolean;
  month_year: string;
  trends: IntelligenceTrend[];
  total: number;
}

export interface TrendDetailResponse {
  success: boolean;
  trend: TrendWithSignals;
}

// Context passed to AI generation functions when using signal mode
export interface SignalContext {
  signals: Array<{
    title: string;
    summary: string;
    why_it_matters: string;
    category: string;
    composite_score: number;
    source: string;
    source_url: string;
    company: string | null;
    practical_implication: string | null;
  }>;
  cluster?: {
    title: string;
    theme: string;
    narrative_summary: string;
  };
  trends?: Array<{
    title: string;
    description: string;
    strategic_summary: string;
    implication_for_operators: string;
    region_scope: string[];
    sector_scope: string[];
    confidence_score: number;
  }>;
}
