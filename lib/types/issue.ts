export type IssueStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';

export type PageType = 'cover' | 'editorial' | 'cover-story-intro' | 'cover-story-analysis'
  | 'cover-story-implications' | 'strategic-implications' | 'enterprise' | 'industry-watch'
  | 'tools' | 'playbook' | 'playbook-continued' | 'strategic-signals'
  | 'executive-briefing' | 'ai-native-org' | 'briefing-prompts' | 'why-this-matters' | 'section-divider' | 'closing';

export type SpreadPosition = 'left' | 'right' | 'full';

export type AssetType = 'cover_image' | 'section_image' | 'pdf' | 'icon';

export type ReviewStatus = 'submitted' | 'approved' | 'changes_requested';

// -- Cover Story (spans pages 3-5) --

export type CoverStory = {
  headline: string;
  subheadline: string;
  introduction: string;
  analysis: string;
  strategic_implications: string;
  pull_quotes: string[];
  evidence?: { statement: string; implication: string };
};

// -- Legacy type (kept for backward compatibility) --

/** @deprecated Use CoverStory instead */
export type DevelopmentItem = {
  headline: string;
  summary: string;
  source: string;
  source_url?: string;
  significance: 'high' | 'medium';
  category: string;
};

// -- Section item types --

export type ImplicationItem = {
  title: string;
  description: string;
  impact_level: 'transformative' | 'significant' | 'emerging';
  sector_relevance: string[];
  source_signal?: string;
  data_point?: string;
};

export type EnterpriseItem = {
  title: string;
  description: string;
  adoption_stage: 'early' | 'growing' | 'mainstream';
  industry: string;
  source_signal?: string;
  data_point?: string;
};

export type IndustryWatchItem = {
  industry: string;
  headline: string;
  description: string;
  trend_direction: 'accelerating' | 'emerging' | 'stabilising' | 'declining';
};

export type ToolItem = {
  name: string;
  description: string;
  category: string;
  url?: string;
  verdict: string;
};

export type PlaybookItem = {
  title: string;
  context: string;
  steps: string[];
  outcome: string;
};

export type StrategicSignalItem = {
  signal: string;
  context: string;
  implication: string;
};

export type BriefingPromptItem = {
  question: string;
  explanation: string;
};

export type ExecutiveTakeawayItem = {
  headline: string;
  explanation: string;
};

export type AiNativeOrgLayer = 'strategy' | 'workflow' | 'agent' | 'model' | 'infrastructure';

export type AiNativeOrgSignal = {
  headline: string;
  explanation: string;
  source_signal?: string;
};

export type AiNativeOrgData = {
  signals: AiNativeOrgSignal[];
  layer_in_focus: AiNativeOrgLayer;
  layer_focus_text: string;
};

// -- Regional Signals --

export type RegionalSignal = {
  region: string;
  signal: string;
};

export type GlobalLandscapeData = {
  regions: { name: string; signals: string[] }[];
};

export type RegionalSignalsData = {
  implications: RegionalSignal[];
  enterprise: RegionalSignal[];
};

// -- Issue --

// -- Derivative artifact types --

export type LinkedInSnippet = {
  hook: string;
  body: string;
  cta: string;
};

export type Issue = {
  id: string;
  slug: string | null;
  title: string;
  month: number;
  year: number;
  edition: number;
  status: IssueStatus;
  is_latest: boolean;
  cover_headline: string;
  cover_subtitle: string | null;
  cover_edition_label: string | null;
  cover_image_url: string | null;
  editorial_note: string | null;
  /** @deprecated Use cover_story_json instead */
  developments_json: DevelopmentItem[];
  cover_story_json: CoverStory | null;
  implications_json: ImplicationItem[];
  enterprise_json: EnterpriseItem[];
  industry_watch_json: IndustryWatchItem[];
  tools_json: ToolItem[];
  playbooks_json: PlaybookItem[];
  strategic_signals_json: StrategicSignalItem[];
  briefing_prompts_json: BriefingPromptItem[];
  executive_briefing_json: ExecutiveTakeawayItem[];
  ai_native_org_json: AiNativeOrgData | null;
  why_this_matters: string | null;
  global_landscape_json: GlobalLandscapeData | null;
  regional_signals_json: RegionalSignalsData | null;
  html_snapshot: string | null;
  pdf_url: string | null;
  // Provenance
  source_signal_ids: string[] | null;
  source_cluster_ids: string[] | null;
  source_trend_ids: string[] | null;
  generation_mode: 'sources' | 'signals' | null;
  // Derivative artifacts
  executive_summary: string | null;
  beehiiv_summary: string | null;
  welcome_email_snippet: string | null;
  linkedin_snippets: LinkedInSnippet[] | null;
  // QA Engine
  qa_score: number | null;
  qa_passed: boolean | null;
  last_qa_run_at: string | null;
  // Timestamps
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type IssueSummary = {
  id: string;
  slug: string | null;
  title: string;
  month: number;
  year: number;
  edition: number;
  status: IssueStatus;
  is_latest: boolean;
  cover_headline: string;
  cover_subtitle: string | null;
  cover_edition_label: string | null;
  published_at: string | null;
  updated_at: string;
};

export type IssuePage = {
  id: string;
  issue_id: string;
  page_number: number;
  page_type: PageType;
  spread_position: SpreadPosition | null;
  title: string | null;
  content_json: Record<string, unknown>;
  html_fragment: string | null;
  created_at: string;
  updated_at: string;
};

export type IssueAsset = {
  id: string;
  issue_id: string;
  asset_type: AssetType;
  url: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
};

export type IssueReview = {
  id: string;
  issue_id: string;
  review_status: ReviewStatus;
  review_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
};
