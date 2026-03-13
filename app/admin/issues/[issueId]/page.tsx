'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import IssueStatusBadge from '@/components/admin/IssueStatusBadge';
import SectionEditor from '@/components/admin/SectionEditor';
import DownloadButton from '@/components/pdf/DownloadButton';
import IssueEditorSkeleton from '@/components/admin/IssueEditorSkeleton';
import ContentIndicator from '@/components/admin/ContentIndicator';
import SectionReadiness, { computeArrayReadiness } from '@/components/admin/SectionReadiness';
import AIGeneratePanel from '@/components/admin/AIGeneratePanel';
import QAPanel from '@/components/admin/QAPanel';
import DistributeButton from '@/components/admin/DistributeButton';
import { INLINE_LIMITS, CONTENT_LIMITS } from '@/lib/constants/content-limits';
import { monthName } from '@/lib/utils/format-date';
import type { Issue, IssueStatus, CoverStory } from '@/lib/types/issue';

const TABS = [
  { key: 'cover', label: 'Cover' },
  { key: 'editorial', label: 'Editorial' },
  { key: 'cover_story', label: 'Cover Story' },
  { key: 'implications', label: 'Implications' },
  { key: 'enterprise', label: 'Enterprise' },
  { key: 'industry_watch', label: 'Industry Watch' },
  { key: 'tools', label: 'Tools' },
  { key: 'playbooks', label: 'Playbooks' },
  { key: 'strategic_signals', label: 'Signals' },
  { key: 'why_this_matters', label: 'Why This Matters' },
];

const IMPL_FIELDS = [
  { key: 'title', label: 'Title', type: 'text' as const },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'impact_level', label: 'Impact Level', type: 'select' as const, options: ['transformative', 'significant', 'emerging'] },
  { key: 'sector_relevance', label: 'Sector Relevance', type: 'string-array' as const, placeholder: 'e.g. Healthcare, Finance...' },
];

const ENTERPRISE_FIELDS = [
  { key: 'title', label: 'Title', type: 'text' as const },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'adoption_stage', label: 'Adoption Stage', type: 'select' as const, options: ['early', 'growing', 'mainstream'] },
  { key: 'industry', label: 'Industry', type: 'text' as const },
];

const TOOL_FIELDS = [
  { key: 'name', label: 'Name', type: 'text' as const },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'category', label: 'Category', type: 'text' as const },
  { key: 'url', label: 'URL', type: 'text' as const },
  { key: 'verdict', label: 'Verdict', type: 'text' as const },
];

const PLAYBOOK_FIELDS = [
  { key: 'title', label: 'Title', type: 'text' as const },
  { key: 'context', label: 'Context', type: 'textarea' as const },
  { key: 'steps', label: 'Steps', type: 'string-array' as const, placeholder: 'Add a step...' },
  { key: 'outcome', label: 'Outcome', type: 'text' as const },
];

const INDUSTRY_WATCH_FIELDS = [
  { key: 'industry', label: 'Industry', type: 'text' as const },
  { key: 'headline', label: 'Headline', type: 'text' as const },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'trend_direction', label: 'Trend Direction', type: 'select' as const, options: ['accelerating', 'emerging', 'stabilising', 'declining'] },
];

const STRATEGIC_SIGNAL_FIELDS = [
  { key: 'signal', label: 'Signal', type: 'text' as const },
  { key: 'context', label: 'Context', type: 'textarea' as const },
  { key: 'implication', label: 'Implication', type: 'textarea' as const },
];

export default function IssueEditorPage() {
  const params = useParams();
  const router = useRouter();
  const issueId = params.issueId as string;

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('cover');
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Local edit state
  const [coverHeadline, setCoverHeadline] = useState('');
  const [coverSubtitle, setCoverSubtitle] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [editorialNote, setEditorialNote] = useState('');
  const [coverStory, setCoverStory] = useState<CoverStory>({ headline: '', subheadline: '', introduction: '', analysis: '', strategic_implications: '', pull_quotes: [] });
  const [implications, setImplications] = useState<Record<string, unknown>[]>([]);
  const [enterprise, setEnterprise] = useState<Record<string, unknown>[]>([]);
  const [tools, setTools] = useState<Record<string, unknown>[]>([]);
  const [playbooks, setPlaybooks] = useState<Record<string, unknown>[]>([]);
  const [industryWatch, setIndustryWatch] = useState<Record<string, unknown>[]>([]);
  const [strategicSignals, setStrategicSignals] = useState<Record<string, unknown>[]>([]);
  const [whyThisMatters, setWhyThisMatters] = useState('');

  const loadIssue = useCallback(async () => {
    try {
      const res = await fetch(`/api/issues/${issueId}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      const i = data.issue as Issue;
      setIssue(i);
      setCoverHeadline(i.cover_headline);
      setCoverSubtitle(i.cover_subtitle || '');
      setCoverImageUrl(i.cover_image_url || '');
      setEditorialNote(i.editorial_note || '');
      setCoverStory(i.cover_story_json || { headline: '', subheadline: '', introduction: '', analysis: '', strategic_implications: '', pull_quotes: [] });
      setImplications(i.implications_json || []);
      setEnterprise(i.enterprise_json || []);
      setTools(i.tools_json || []);
      setPlaybooks(i.playbooks_json || []);
      setIndustryWatch(i.industry_watch_json || []);
      setStrategicSignals(i.strategic_signals_json || []);
      setWhyThisMatters(i.why_this_matters || '');
    } catch {
      setError('Failed to load issue');
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  useEffect(() => { loadIssue(); }, [loadIssue]);

  // Warn on unsaved changes before navigating away
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  async function saveIssue() {
    setSaving(true);
    setSaveMessage('');
    setError('');

    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cover_headline: coverHeadline,
          cover_subtitle: coverSubtitle || null,
          cover_image_url: coverImageUrl || null,
          editorial_note: editorialNote || null,
          cover_story_json: coverStory,
          implications_json: implications,
          enterprise_json: enterprise,
          industry_watch_json: industryWatch,
          tools_json: tools,
          playbooks_json: playbooks,
          strategic_signals_json: strategicSignals,
          why_this_matters: whyThisMatters || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Save failed');
      }

      const data = await res.json();
      setIssue(data.issue);
      setIsDirty(false);
      setSaveMessage('Saved');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(newStatus: IssueStatus) {
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Status update failed');
      }

      const data = await res.json();
      setIssue(data.issue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed');
    }
  }

  async function publishIssue() {
    try {
      const res = await fetch(`/api/issues/${issueId}/publish`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Publish failed');
      }
      const data = await res.json();
      setIssue(data.issue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed');
    }
  }

  async function deleteIssue() {
    if (!confirm('Delete this issue? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/issues/${issueId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.push('/admin/issues');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  function getTabReadiness(key: string): 'empty' | 'partial' | 'complete' {
    switch (key) {
      case 'cover':
        if (!coverHeadline.trim()) return 'empty';
        return coverSubtitle.trim() ? 'complete' : 'partial';
      case 'editorial':
        return editorialNote.trim() ? 'complete' : 'empty';
      case 'cover_story':
        if (!coverStory.headline && !coverStory.introduction) return 'empty';
        if (coverStory.headline && coverStory.introduction && coverStory.analysis && coverStory.strategic_implications) return 'complete';
        return 'partial';
      case 'industry_watch':
        return computeArrayReadiness(industryWatch, ['industry', 'headline', 'description']);
      case 'strategic_signals':
        return computeArrayReadiness(strategicSignals, ['signal', 'context', 'implication']);
      case 'why_this_matters':
        return whyThisMatters.trim() ? 'complete' : 'empty';
      case 'implications':
        return computeArrayReadiness(implications, ['title', 'description']);
      case 'enterprise':
        return computeArrayReadiness(enterprise, ['title', 'description']);
      case 'tools':
        return computeArrayReadiness(tools, ['name', 'description', 'verdict']);
      case 'playbooks':
        return computeArrayReadiness(playbooks, ['title', 'context', 'outcome']);
      default:
        return 'empty';
    }
  }

  if (loading) return <IssueEditorSkeleton />;
  if (!issue) return <div className="p-8 text-[#C0392B]">Issue not found</div>;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-white">
              Edition #{String(issue.edition).padStart(2, '0')}
            </h1>
            <IssueStatusBadge status={issue.status} qaPassed={issue.qa_passed} />
          </div>
          <p className="text-[#888888] text-sm">{monthName(issue.month)} {issue.year}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {saveMessage && <span className="text-[#22C55E] text-xs mr-2">{saveMessage}</span>}
          {isDirty && !saveMessage && <span className="text-[#B8860B] text-xs mr-2">Unsaved changes</span>}
          <button
            onClick={saveIssue}
            disabled={saving}
            className={`px-4 py-2 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors ${
              isDirty ? 'bg-[#B8860B] hover:bg-[#D4A843] ring-2 ring-[#B8860B]/30' : 'bg-[#B8860B] hover:bg-[#D4A843]'
            }`}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <Link
            href={`/issues/${issueId}/viewer`}
            className="px-4 py-2 bg-[#222222] border border-[#333333] text-white text-sm font-medium rounded-lg hover:border-[#B8860B] transition-colors"
            target="_blank"
          >
            Preview
          </Link>
          <DownloadButton
            issueId={issueId}
            filename={`dg-ai-report-edition-${String(issue.edition).padStart(2, '0')}-${monthName(issue.month).toLowerCase()}-${issue.year}.pdf`}
          />
        </div>
      </div>

      {error && <p className="text-[#C0392B] text-sm mb-4">{error}</p>}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content area */}
        <div className="flex-1 min-w-0">
          {/* AI Generation panel (draft issues only) */}
          {issue.status === 'draft' && (
            <div className="mb-5">
              <AIGeneratePanel issueId={issueId} onGenerated={loadIssue} />
            </div>
          )}

          {/* Section tabs */}
          <div className="flex gap-1 mb-5 border-b border-[#333333] pb-3 overflow-x-auto">
            {TABS.map((tab) => {
              const readiness = getTabReadiness(tab.key);
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    activeTab === tab.key
                      ? 'bg-[#B8860B]/15 text-[#B8860B]'
                      : 'text-[#888888] hover:text-white hover:bg-[#222222]'
                  }`}
                >
                  {tab.label}
                  <SectionReadiness status={readiness} />
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="bg-[#222222] border border-[#333333] rounded-lg p-5">
            {activeTab === 'cover' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] text-[#888888] uppercase tracking-wider mb-1.5">Cover Headline</label>
                  <input
                    type="text"
                    value={coverHeadline}
                    onChange={(e) => { setCoverHeadline(e.target.value); setIsDirty(true); }}
                    className="w-full px-3 py-2.5 bg-[#1C1C1C] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B]"
                  />
                  <ContentIndicator value={coverHeadline} limit={INLINE_LIMITS.cover_headline} />
                </div>
                <div>
                  <label className="block text-[11px] text-[#888888] uppercase tracking-wider mb-1.5">Cover Subtitle</label>
                  <input
                    type="text"
                    value={coverSubtitle}
                    onChange={(e) => { setCoverSubtitle(e.target.value); setIsDirty(true); }}
                    className="w-full px-3 py-2.5 bg-[#1C1C1C] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B]"
                  />
                  <ContentIndicator value={coverSubtitle} limit={INLINE_LIMITS.cover_subtitle} />
                </div>
                <div>
                  <label className="block text-[11px] text-[#888888] uppercase tracking-wider mb-1.5">Cover Image URL</label>
                  <input
                    type="text"
                    value={coverImageUrl}
                    onChange={(e) => { setCoverImageUrl(e.target.value); setIsDirty(true); }}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 bg-[#1C1C1C] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B]"
                  />
                  {coverImageUrl && (
                    <div className="mt-3 rounded overflow-hidden border border-[#333333]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coverImageUrl} alt="Cover preview" className="w-full max-h-48 object-cover" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'editorial' && (
              <div>
                <label className="block text-[11px] text-[#888888] uppercase tracking-wider mb-1.5">Editorial Note</label>
                <textarea
                  value={editorialNote}
                  onChange={(e) => { setEditorialNote(e.target.value); setIsDirty(true); }}
                  rows={16}
                  placeholder="Write the editorial note for this issue. Separate paragraphs with a blank line."
                  className="w-full px-3 py-2.5 bg-[#1C1C1C] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B] resize-y leading-relaxed"
                />
                <ContentIndicator value={editorialNote} limit={INLINE_LIMITS.editorial_note} />
              </div>
            )}

            {activeTab === 'cover_story' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] text-[#888888] uppercase tracking-wider mb-1.5">Cover Story Headline</label>
                  <input
                    type="text"
                    value={coverStory.headline}
                    onChange={(e) => { setCoverStory({...coverStory, headline: e.target.value}); setIsDirty(true); }}
                    className="w-full px-3 py-2.5 bg-[#1C1C1C] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B]"
                  />
                  <ContentIndicator value={coverStory.headline} limit={CONTENT_LIMITS.cover_story?.headline} />
                </div>
                <div>
                  <label className="block text-[11px] text-[#888888] uppercase tracking-wider mb-1.5">Subheadline</label>
                  <input
                    type="text"
                    value={coverStory.subheadline}
                    onChange={(e) => { setCoverStory({...coverStory, subheadline: e.target.value}); setIsDirty(true); }}
                    className="w-full px-3 py-2.5 bg-[#1C1C1C] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B]"
                  />
                  <ContentIndicator value={coverStory.subheadline} limit={CONTENT_LIMITS.cover_story?.subheadline} />
                </div>
                <div>
                  <label className="block text-[11px] text-[#888888] uppercase tracking-wider mb-1.5">Introduction</label>
                  <textarea
                    value={coverStory.introduction}
                    onChange={(e) => { setCoverStory({...coverStory, introduction: e.target.value}); setIsDirty(true); }}
                    rows={12}
                    placeholder="Write the introduction for the cover story..."
                    className="w-full px-3 py-2.5 bg-[#1C1C1C] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B] resize-y leading-relaxed"
                  />
                  <ContentIndicator value={coverStory.introduction} limit={CONTENT_LIMITS.cover_story?.introduction} />
                </div>
                <div>
                  <label className="block text-[11px] text-[#888888] uppercase tracking-wider mb-1.5">Analysis</label>
                  <textarea
                    value={coverStory.analysis}
                    onChange={(e) => { setCoverStory({...coverStory, analysis: e.target.value}); setIsDirty(true); }}
                    rows={16}
                    placeholder="Write the main analysis..."
                    className="w-full px-3 py-2.5 bg-[#1C1C1C] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B] resize-y leading-relaxed"
                  />
                  <ContentIndicator value={coverStory.analysis} limit={CONTENT_LIMITS.cover_story?.analysis} />
                </div>
                <div>
                  <label className="block text-[11px] text-[#888888] uppercase tracking-wider mb-1.5">Strategic Implications</label>
                  <textarea
                    value={coverStory.strategic_implications}
                    onChange={(e) => { setCoverStory({...coverStory, strategic_implications: e.target.value}); setIsDirty(true); }}
                    rows={12}
                    placeholder="Write the strategic implications..."
                    className="w-full px-3 py-2.5 bg-[#1C1C1C] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B] resize-y leading-relaxed"
                  />
                  <ContentIndicator value={coverStory.strategic_implications} limit={CONTENT_LIMITS.cover_story?.strategic_implications} />
                </div>
                <div>
                  <label className="block text-[11px] text-[#888888] uppercase tracking-wider mb-1.5">Pull Quotes</label>
                  <div className="space-y-2">
                    {coverStory.pull_quotes.map((quote, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="flex-1 px-3 py-2 bg-[#1C1C1C] border border-[#333333] rounded text-white text-sm leading-relaxed">&ldquo;{quote}&rdquo;</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = coverStory.pull_quotes.filter((_, i) => i !== idx);
                            setCoverStory({...coverStory, pull_quotes: updated});
                            setIsDirty(true);
                          }}
                          className="px-2 py-2 text-[#C0392B] hover:bg-[#C0392B]/10 rounded transition-colors text-xs"
                          title="Remove quote"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const input = (e.currentTarget.elements.namedItem('newQuote') as HTMLInputElement);
                        const val = input.value.trim();
                        if (!val) return;
                        setCoverStory({...coverStory, pull_quotes: [...coverStory.pull_quotes, val]});
                        setIsDirty(true);
                        input.value = '';
                      }}
                      className="flex gap-2"
                    >
                      <input
                        name="newQuote"
                        type="text"
                        placeholder="Add a pull quote..."
                        className="flex-1 px-3 py-2 bg-[#1C1C1C] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B]"
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 bg-[#B8860B]/15 text-[#B8860B] text-xs font-semibold rounded hover:bg-[#B8860B]/25 transition-colors"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'implications' && (
              <SectionEditor
                sectionKey="implications"
                label="Strategic Implications"
                items={implications}
                fields={IMPL_FIELDS}
                onChange={(v) => { setImplications(v); setIsDirty(true); }}
              />
            )}

            {activeTab === 'enterprise' && (
              <SectionEditor
                sectionKey="enterprise"
                label="Enterprise AI Adoption"
                items={enterprise}
                fields={ENTERPRISE_FIELDS}
                onChange={(v) => { setEnterprise(v); setIsDirty(true); }}
              />
            )}

            {activeTab === 'tools' && (
              <SectionEditor
                sectionKey="tools"
                label="Tools Worth Watching"
                items={tools}
                fields={TOOL_FIELDS}
                onChange={(v) => { setTools(v); setIsDirty(true); }}
              />
            )}

            {activeTab === 'playbooks' && (
              <SectionEditor
                sectionKey="playbooks"
                label="Operator Playbooks"
                items={playbooks}
                fields={PLAYBOOK_FIELDS}
                onChange={(v) => { setPlaybooks(v); setIsDirty(true); }}
              />
            )}

            {activeTab === 'industry_watch' && (
              <SectionEditor
                sectionKey="industry_watch"
                label="Industry Watch"
                items={industryWatch}
                fields={INDUSTRY_WATCH_FIELDS}
                onChange={(v) => { setIndustryWatch(v); setIsDirty(true); }}
              />
            )}

            {activeTab === 'strategic_signals' && (
              <SectionEditor
                sectionKey="strategic_signals"
                label="Strategic Signals"
                items={strategicSignals}
                fields={STRATEGIC_SIGNAL_FIELDS}
                onChange={(v) => { setStrategicSignals(v); setIsDirty(true); }}
              />
            )}

            {activeTab === 'why_this_matters' && (
              <div>
                <label className="block text-[11px] text-[#888888] uppercase tracking-wider mb-1.5">Why This Matters</label>
                <p className="text-[10px] text-[#666666] mb-3">Static section explaining why this report is relevant to operators, founders, and executives navigating AI adoption. 120-180 words, strategic tone.</p>
                <textarea
                  value={whyThisMatters}
                  onChange={(e) => { setWhyThisMatters(e.target.value); setIsDirty(true); }}
                  rows={10}
                  placeholder="Explain why the AI developments covered in this report matter for modern organisations and decision-makers..."
                  className="w-full px-3 py-2.5 bg-[#1C1C1C] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B] resize-y leading-relaxed"
                />
                <ContentIndicator value={whyThisMatters} limit={INLINE_LIMITS.why_this_matters} />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-56 flex-shrink-0">
          <div className="bg-[#222222] border border-[#333333] rounded-lg p-4 space-y-3">
            <h3 className="text-[11px] text-[#888888] uppercase tracking-wider font-semibold">Status Workflow</h3>

            {issue.status === 'draft' && (
              <button
                onClick={() => updateStatus('review')}
                className="w-full py-2 text-xs font-semibold bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 rounded-lg hover:bg-[#3B82F6]/25 transition-colors"
              >
                Submit for Review
              </button>
            )}

            {issue.status === 'review' && (
              <>
                <button
                  onClick={() => updateStatus('approved')}
                  className="w-full py-2 text-xs font-semibold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 rounded-lg hover:bg-[#22C55E]/25 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => updateStatus('draft')}
                  className="w-full py-2 text-xs font-semibold text-[#888888] border border-[#333333] rounded-lg hover:bg-[#1C1C1C] transition-colors"
                >
                  Return to Draft
                </button>
              </>
            )}

            {issue.status === 'approved' && (
              <button
                onClick={publishIssue}
                disabled={issue.qa_passed !== true && issue.qa_override !== true}
                className={`w-full py-2 text-xs font-semibold rounded-lg transition-colors ${
                  issue.qa_passed === true || issue.qa_override === true
                    ? 'bg-[#B8860B]/15 text-[#B8860B] border border-[#B8860B]/30 hover:bg-[#B8860B]/25'
                    : 'bg-[#333333]/50 text-[#666666] border border-[#333333] cursor-not-allowed'
                }`}
                title={issue.qa_passed !== true && issue.qa_override !== true ? 'QA review must pass before publishing (or use QA override)' : undefined}
              >
                Publish Issue
              </button>
            )}

            {issue.status === 'published' && (
              <>
                <DistributeButton issueId={issueId} />
                <button
                  onClick={() => updateStatus('archived')}
                  className="w-full py-2 text-xs font-semibold text-[#888888] border border-[#333333] rounded-lg hover:bg-[#1C1C1C] transition-colors"
                >
                  Archive Issue
                </button>
              </>
            )}

            {['draft', 'review'].includes(issue.status) && (
              <>
                <div className="border-t border-[#333333] pt-3 mt-3">
                  <button
                    onClick={deleteIssue}
                    className="w-full py-2 text-xs font-semibold text-[#C0392B] border border-[#C0392B]/20 rounded-lg hover:bg-[#C0392B]/10 transition-colors"
                  >
                    Delete Issue
                  </button>
                </div>
              </>
            )}
          </div>

          {/* QA Review */}
          <div className="mt-4">
            <QAPanel
              issueId={issueId}
              qaScore={issue.qa_score}
              qaPassed={issue.qa_passed}
              qaOverride={issue.qa_override}
              lastQaRunAt={issue.last_qa_run_at}
              onQAComplete={loadIssue}
            />
          </div>

          {/* Info */}
          <div className="bg-[#222222] border border-[#333333] rounded-lg p-4 mt-4">
            <h3 className="text-[11px] text-[#888888] uppercase tracking-wider font-semibold mb-3">Info</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#888888]">Created</span>
                <span className="text-[#B0B0B0]">{new Date(issue.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888888]">Updated</span>
                <span className="text-[#B0B0B0]">{new Date(issue.updated_at).toLocaleDateString()}</span>
              </div>
              {issue.published_at && (
                <div className="flex justify-between">
                  <span className="text-[#888888]">Published</span>
                  <span className="text-[#B0B0B0]">{new Date(issue.published_at).toLocaleDateString()}</span>
                </div>
              )}
              {issue.pdf_url && (
                <div className="pt-2 border-t border-[#333333]">
                  <a href={issue.pdf_url} target="_blank" rel="noopener noreferrer" className="text-[#B8860B] hover:underline">
                    View PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
