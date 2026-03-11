import type { DevelopmentItem, ImplicationItem, EnterpriseItem, ToolItem, PlaybookItem } from './issue';

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

export type DevelopmentsPageData = {
  items: DevelopmentItem[];
};

export type ImplicationsPageData = {
  items: ImplicationItem[];
};

export type EnterprisePageData = {
  items: EnterpriseItem[];
};

export type ToolsPageData = {
  items: ToolItem[];
};

export type PlaybooksPageData = {
  items: PlaybookItem[];
};

export type ClosingPageData = {
  edition: number;
  month: string;
  year: number;
};
