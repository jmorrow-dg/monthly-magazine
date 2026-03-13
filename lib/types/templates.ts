import type { ImplicationItem, EnterpriseItem, IndustryWatchItem, ToolItem, PlaybookItem, StrategicSignalItem, BriefingPromptItem, ExecutiveTakeawayItem, AiNativeOrgData } from './issue';

export type CoverPageData = {
  headline: string;
  subtitle: string | null;
  editionLabel: string;
  coverImageUrl: string | null;
};

export type EditorialPageData = {
  note: string;
  month: string;
  edition: number;
};

export type CoverStoryIntroPageData = {
  headline: string;
  subheadline: string;
  introduction: string;
  pullQuote?: string;
};

export type CoverStoryAnalysisPageData = {
  analysis: string;
  pullQuotes: string[];
};

export type CoverStoryImplicationsPageData = {
  strategicImplications: string;
  pullQuotes: string[];
};

export type ImplicationsPageData = {
  items: ImplicationItem[];
  pullQuote?: string;
};

export type EnterprisePageData = {
  items: EnterpriseItem[];
  pullQuote?: string;
};

export type IndustryWatchPageData = {
  items: IndustryWatchItem[];
};

export type ToolsPageData = {
  items: ToolItem[];
};

export type PlaybooksPageData = {
  items: PlaybookItem[];
  pullQuote?: string;
};

export type StrategicSignalsPageData = {
  items: StrategicSignalItem[];
};

export type BriefingPromptsPageData = {
  items: BriefingPromptItem[];
};

export type ExecutiveBriefingPageData = {
  items: ExecutiveTakeawayItem[];
  coverHeadline?: string;
};

export type AiNativeOrgPageData = {
  data: AiNativeOrgData | null;
};

export type WhyThisMattersPageData = {
  content: string;
};

export type ClosingPageData = {
  edition: number;
  month: string;
  year: number;
};

export type SectionDividerPageData = {
  title: string;
  subtitle?: string;
};
