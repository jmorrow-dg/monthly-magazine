import { getSupabase } from './client';
import type { Issue, IssueSummary, IssueStatus, IssueFormat, IssuePage, IssueAsset, IssueReview } from '@/lib/types/issue';
import type { QAReport, QAReportRow } from '@/lib/types/qa';

// ── Slug Utilities ──────────────────────────────────────────────────────────

/**
 * Generate a URL-friendly slug from issue metadata.
 * Format: "2026-03-edition-04" or "2026-mar-edition-04"
 */
export function generateIssueSlug(year: number, month: number, edition: number): string {
  const monthStr = String(month).padStart(2, '0');
  const editionStr = String(edition).padStart(2, '0');
  return `${year}-${monthStr}-edition-${editionStr}`;
}

// ── Issues ──────────────────────────────────────────────────────────────────

export type CreateIssueInput = {
  title?: string;
  month: number;
  year: number;
  edition: number;
  cover_headline?: string;
  cover_subtitle?: string | null;
  cover_edition_label?: string | null;
  format?: IssueFormat;
  week_start?: string | null;
  week_end?: string | null;
};

export async function createIssue(data: CreateIssueInput): Promise<Issue> {
  const supabase = getSupabase();
  const slug = generateIssueSlug(data.year, data.month, data.edition);

  const { data: issue, error } = await supabase
    .from('issues')
    .insert({
      title: data.title || 'The David & Goliath AI Intelligence Report',
      month: data.month,
      year: data.year,
      edition: data.edition,
      slug,
      cover_headline: data.cover_headline || 'AI Intelligence Report',
      cover_subtitle: data.cover_subtitle || null,
      cover_edition_label: data.cover_edition_label || null,
      format: data.format || 'monthly',
      week_start: data.week_start || null,
      week_end: data.week_end || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create issue: ${error.message}`);
  return issue as Issue;
}

export async function getIssue(id: string): Promise<Issue | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch issue: ${error.message}`);
  }
  return data as Issue;
}

export async function listIssues(status?: IssueStatus, format?: IssueFormat): Promise<IssueSummary[]> {
  const supabase = getSupabase();
  let query = supabase
    .from('issues')
    .select('id, slug, title, month, year, edition, format, status, is_latest, cover_headline, cover_subtitle, cover_edition_label, week_start, week_end, published_at, updated_at')
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .order('edition', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }
  if (format) {
    query = query.eq('format', format);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list issues: ${error.message}`);
  return (data || []) as IssueSummary[];
}

export async function updateIssue(id: string, updates: Partial<Issue>): Promise<Issue | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('issues')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update issue: ${error.message}`);
  return data as Issue;
}

export async function updateIssueStatus(id: string, status: IssueStatus): Promise<Issue | null> {
  const updates: Partial<Issue> = { status };
  if (status === 'published') {
    updates.published_at = new Date().toISOString();
  }
  return updateIssue(id, updates);
}

export async function deleteIssue(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('issues').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete issue: ${error.message}`);
}

export async function getLatestPublishedIssue(): Promise<Issue | null> {
  const supabase = getSupabase();

  // Try is_latest flag first (fast path)
  const { data: flagged, error: flagError } = await supabase
    .from('issues')
    .select('*')
    .eq('is_latest', true)
    .eq('status', 'published')
    .limit(1)
    .single();

  if (!flagError && flagged) return flagged as Issue;

  // Fallback: order by published_at
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch latest issue: ${error.message}`);
  }
  return data as Issue;
}

/**
 * Fetch an issue by slug.
 */
export async function getIssueBySlug(slug: string): Promise<Issue | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch issue by slug: ${error.message}`);
  }
  return data as Issue;
}

/**
 * Set an issue as the latest, clearing the flag on all other issues.
 */
export async function setLatestIssue(issueId: string): Promise<void> {
  const supabase = getSupabase();

  // Clear existing latest flag
  const { error: clearError } = await supabase
    .from('issues')
    .update({ is_latest: false })
    .eq('is_latest', true);

  if (clearError) {
    console.error('Failed to clear is_latest flags:', clearError);
  }

  // Set new latest
  const { error: setError } = await supabase
    .from('issues')
    .update({ is_latest: true })
    .eq('id', issueId);

  if (setError) {
    throw new Error(`Failed to set latest issue: ${setError.message}`);
  }
}

// ── Issue Pages ─────────────────────────────────────────────────────────────

export type UpsertPageInput = {
  issue_id: string;
  page_number: number;
  page_type: string;
  spread_position?: string | null;
  title?: string | null;
  content_json?: Record<string, unknown>;
  html_fragment?: string | null;
};

export async function getIssuePages(issueId: string): Promise<IssuePage[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('issue_pages')
    .select('*')
    .eq('issue_id', issueId)
    .order('page_number', { ascending: true });

  if (error) throw new Error(`Failed to fetch pages: ${error.message}`);
  return (data || []) as IssuePage[];
}

export async function upsertIssuePage(input: UpsertPageInput): Promise<IssuePage> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('issue_pages')
    .upsert(input, { onConflict: 'issue_id,page_number' })
    .select()
    .single();

  if (error) throw new Error(`Failed to upsert page: ${error.message}`);
  return data as IssuePage;
}

export async function updatePageHtml(pageId: string, html: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('issue_pages')
    .update({ html_fragment: html })
    .eq('id', pageId);

  if (error) throw new Error(`Failed to update page HTML: ${error.message}`);
}

// ── Issue Assets ────────────────────────────────────────────────────────────

export type CreateAssetInput = {
  issue_id: string;
  asset_type: string;
  url: string;
  metadata_json?: Record<string, unknown>;
};

export async function createIssueAsset(input: CreateAssetInput): Promise<IssueAsset> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('issue_assets')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`Failed to create asset: ${error.message}`);
  return data as IssueAsset;
}

export async function getIssueAssets(issueId: string): Promise<IssueAsset[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('issue_assets')
    .select('*')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch assets: ${error.message}`);
  return (data || []) as IssueAsset[];
}

// ── Issue Reviews ───────────────────────────────────────────────────────────

export type CreateReviewInput = {
  issue_id: string;
  review_status: string;
  review_notes?: string | null;
  approved_by?: string | null;
};

export async function createIssueReview(input: CreateReviewInput): Promise<IssueReview> {
  const supabase = getSupabase();
  const now = input.review_status === 'approved' ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from('issue_reviews')
    .insert({
      ...input,
      approved_at: now,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create review: ${error.message}`);
  return data as IssueReview;
}

export async function getIssueReviews(issueId: string): Promise<IssueReview[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('issue_reviews')
    .select('*')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch reviews: ${error.message}`);
  return (data || []) as IssueReview[];
}

// ── QA Reports ──────────────────────────────────────────────────────────────

export async function createQAReport(report: QAReport): Promise<QAReportRow> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('qa_reports')
    .insert({
      issue_id: report.issue_id,
      qa_score: report.qa_score,
      qa_status: report.qa_status,
      score_breakdown: report.score_breakdown,
      citation_coverage_score: report.citation_coverage_score,
      unsupported_claim_count: report.unsupported_claim_count,
      structural_error_count: report.structural_error_count,
      editorial_violation_count: report.editorial_violation_count,
      numerical_mismatch_count: report.numerical_mismatch_count,
      reasoning_flag_count: report.reasoning_flag_count,
      structural_findings: report.structural_findings,
      unsupported_claims: report.unsupported_claims,
      citation_map: report.citation_map,
      numerical_mismatches: report.numerical_mismatches,
      editorial_flags: report.editorial_flags,
      llm_review_findings: report.llm_review_findings,
      derivative_consistency_findings: report.derivative_consistency_findings,
      selected_references: report.selected_references,
      summary: report.summary,
      passed: report.qa_passed,
      qa_passed: report.qa_passed,
      threshold_applied: report.threshold_applied,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create QA report: ${error.message}`);
  return data as QAReportRow;
}

export async function getLatestQAReport(issueId: string): Promise<QAReportRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('qa_reports')
    .select('*')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch QA report: ${error.message}`);
  }
  return data as QAReportRow;
}

export async function getQAHistory(issueId: string, limit = 10): Promise<QAReportRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('qa_reports')
    .select('*')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch QA history: ${error.message}`);
  return (data || []) as QAReportRow[];
}

// ── Storage ─────────────────────────────────────────────────────────────────

export async function uploadPdf(
  issueId: string,
  pdfBuffer: Uint8Array,
  customFileName?: string,
): Promise<string> {
  const supabase = getSupabase();
  const fileName = customFileName || `issue-${issueId}.pdf`;

  const { error } = await supabase.storage
    .from('magazine-pdfs')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) throw new Error(`Failed to upload PDF: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from('magazine-pdfs')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}
