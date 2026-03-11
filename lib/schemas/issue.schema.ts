import { z } from 'zod';

const developmentItemSchema = z.object({
  headline: z.string().min(1).max(200),
  summary: z.string().min(1).max(500),
  source: z.string().max(200),
  source_url: z.string().max(2000).optional(),
  significance: z.enum(['high', 'medium']),
  category: z.string().max(100),
});

const implicationItemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  impact_level: z.enum(['transformative', 'significant', 'emerging']),
  sector_relevance: z.array(z.string()),
});

const enterpriseItemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  adoption_stage: z.enum(['early', 'growing', 'mainstream']),
  industry: z.string().max(100),
});

const toolItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(300),
  category: z.string().max(100),
  url: z.string().max(500).optional(),
  verdict: z.string().min(1).max(200),
});

const playbookItemSchema = z.object({
  title: z.string().min(1).max(200),
  context: z.string().min(1).max(300),
  steps: z.array(z.string().max(200)),
  outcome: z.string().min(1).max(300),
});

export const createIssueSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024),
  edition: z.number().int().min(1),
  cover_headline: z.string().min(1).max(200).optional(),
  cover_subtitle: z.string().max(200).nullable().optional(),
});

export const updateIssueSchema = z.object({
  cover_headline: z.string().min(1).max(200).optional(),
  cover_subtitle: z.string().max(200).nullable().optional(),
  cover_edition_label: z.string().max(100).nullable().optional(),
  cover_image_url: z.string().max(2000).nullable().optional(),
  editorial_note: z.string().max(5000).nullable().optional(),
  developments_json: z.array(developmentItemSchema).optional(),
  implications_json: z.array(implicationItemSchema).optional(),
  enterprise_json: z.array(enterpriseItemSchema).optional(),
  tools_json: z.array(toolItemSchema).optional(),
  playbooks_json: z.array(playbookItemSchema).optional(),
  status: z.enum(['draft', 'review', 'approved', 'published', 'archived']).optional(),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
