import { getSupabase } from './client';
import type { Issue, IssueSummary, IssueStatus, IssuePage, IssueAsset, IssueReview } from '@/lib/types/issue';

// ── Issues ──────────────────────────────────────────────────────────────────

export type CreateIssueInput = {
  title?: string;
  month: number;
  year: number;
  edition: number;
  cover_headline?: string;
  cover_subtitle?: string | null;
  cover_edition_label?: string | null;
};

export async function createIssue(data: CreateIssueInput): Promise<Issue> {
  const supabase = getSupabase();
  const { data: issue, error } = await supabase
    .from('issues')
    .insert({
      title: data.title || 'The David & Goliath AI Intelligence Report',
      month: data.month,
      year: data.year,
      edition: data.edition,
      cover_headline: data.cover_headline || 'AI Intelligence Report',
      cover_subtitle: data.cover_subtitle || null,
      cover_edition_label: data.cover_edition_label || null,
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

export async function listIssues(status?: IssueStatus): Promise<IssueSummary[]> {
  const supabase = getSupabase();
  let query = supabase
    .from('issues')
    .select('id, title, month, year, edition, status, cover_headline, cover_subtitle, cover_edition_label, published_at, updated_at')
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (status) {
    query = query.eq('status', status);
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
