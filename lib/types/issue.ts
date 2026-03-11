export type IssueStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';

export type PageType = 'cover' | 'editorial' | 'developments' | 'implications'
  | 'enterprise' | 'tools' | 'playbooks' | 'closing';

export type SpreadPosition = 'left' | 'right' | 'full';

export type AssetType = 'cover_image' | 'section_image' | 'pdf' | 'icon';

export type ReviewStatus = 'submitted' | 'approved' | 'changes_requested';

export type DevelopmentItem = {
  headline: string;
  summary: string;
  source: string;
  source_url?: string;
  significance: 'high' | 'medium';
  category: string;
};

export type ImplicationItem = {
  title: string;
  description: string;
  impact_level: 'transformative' | 'significant' | 'emerging';
  sector_relevance: string[];
};

export type EnterpriseItem = {
  title: string;
  description: string;
  adoption_stage: 'early' | 'growing' | 'mainstream';
  industry: string;
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

export type Issue = {
  id: string;
  title: string;
  month: number;
  year: number;
  edition: number;
  status: IssueStatus;
  cover_headline: string;
  cover_subtitle: string | null;
  cover_edition_label: string | null;
  cover_image_url: string | null;
  editorial_note: string | null;
  developments_json: DevelopmentItem[];
  implications_json: ImplicationItem[];
  enterprise_json: EnterpriseItem[];
  tools_json: ToolItem[];
  playbooks_json: PlaybookItem[];
  html_snapshot: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type IssueSummary = {
  id: string;
  title: string;
  month: number;
  year: number;
  edition: number;
  status: IssueStatus;
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
