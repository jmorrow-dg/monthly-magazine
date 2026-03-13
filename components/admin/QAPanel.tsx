'use client';

import { useState } from 'react';
import type { QAReportRow } from '@/lib/types/qa';

interface QAPanelProps {
  issueId: string;
  qaScore: number | null;
  qaPassed: boolean | null;
  qaOverride: boolean | null;
  lastQaRunAt: string | null;
  onQAComplete: () => void;
}

const CATEGORY_LABELS: Record<string, { label: string; maxScore: number }> = {
  factual_grounding: { label: 'Factual Grounding', maxScore: 25 },
  citation_coverage: { label: 'Citation Coverage', maxScore: 20 },
  numerical_accuracy: { label: 'Numerical Accuracy', maxScore: 15 },
  structural_completeness: { label: 'Structural Completeness', maxScore: 10 },
  editorial_compliance: { label: 'Editorial Compliance', maxScore: 10 },
  reasoning_validity: { label: 'Reasoning Validity', maxScore: 10 },
  derivative_consistency: { label: 'Derivative Consistency', maxScore: 10 },
};

type FindingItem = { severity: string; section?: string; message: string; rule?: string; finding_type?: string; claim_text?: string; derivative?: string };

const FINDING_SECTIONS = [
  { key: 'structural_findings', label: 'Structural Issues' },
  { key: 'editorial_flags', label: 'Editorial Flags' },
  { key: 'numerical_mismatches', label: 'Numerical Mismatches' },
  { key: 'unsupported_claims', label: 'Unsupported Claims' },
  { key: 'llm_review_findings', label: 'Reasoning Issues' },
  { key: 'derivative_consistency_findings', label: 'Derivative Consistency' },
] as const;

function getScoreColor(score: number): string {
  if (score >= 95) return '#22C55E';
  if (score >= 85) return '#F59E0B';
  return '#C0392B';
}

function getSeverityColor(severity: string): string {
  if (severity === 'blocker') return '#DC2626';
  if (severity === 'error') return '#C0392B';
  if (severity === 'warning') return '#F59E0B';
  return '#3B82F6';
}

function getSeverityLabel(severity: string): string {
  if (severity === 'blocker') return 'BLOCKER';
  if (severity === 'error') return 'ERROR';
  if (severity === 'warning') return 'WARN';
  return 'INFO';
}

export default function QAPanel({ issueId, qaScore, qaPassed, qaOverride, lastQaRunAt, onQAComplete }: QAPanelProps) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<QAReportRow | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set());
  const [overrideReason, setOverrideReason] = useState('');
  const [overriding, setOverriding] = useState(false);
  const [showOverrideForm, setShowOverrideForm] = useState(false);

  async function runQA() {
    setRunning(true);
    setError('');
    try {
      const res = await fetch(`/api/issues/${issueId}/qa-review`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'QA review failed');
      }
      const data = await res.json();
      setReport(data.report);
      setExpanded(true);
      onQAComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'QA review failed');
    } finally {
      setRunning(false);
    }
  }

  async function loadReport() {
    setLoadingReport(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/qa-report`);
      if (!res.ok) throw new Error('Failed to load report');
      const data = await res.json();
      if (data.report) {
        setReport(data.report);
        setExpanded(true);
      }
    } catch {
      // silent
    } finally {
      setLoadingReport(false);
    }
  }

  async function submitOverride() {
    if (!overrideReason.trim()) return;
    setOverriding(true);
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qa_override: true,
          qa_override_reason: overrideReason.trim(),
        }),
      });
      if (!res.ok) throw new Error('Override failed');
      setShowOverrideForm(false);
      setOverrideReason('');
      onQAComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Override failed');
    } finally {
      setOverriding(false);
    }
  }

  function toggleFindingSection(key: string) {
    setExpandedFindings(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const displayScore = report?.qa_score ?? qaScore;
  const displayPassed = report?.qa_passed ?? qaPassed;
  const displayRunAt = report?.created_at ?? lastQaRunAt;

  return (
    <div className="bg-[#222222] border border-[#333333] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] text-[#888888] uppercase tracking-wider font-semibold">QA Review</h3>
        {displayScore !== null && displayScore !== undefined && (
          <span
            className="text-lg font-bold"
            style={{ color: getScoreColor(displayScore) }}
          >
            {displayScore}/100
          </span>
        )}
      </div>

      {/* Score summary */}
      {displayScore !== null && displayScore !== undefined && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: displayPassed ? '#22C55E' : '#C0392B' }}
            />
            <span className="text-xs" style={{ color: displayPassed ? '#22C55E' : '#C0392B' }}>
              {displayPassed ? 'QA Passed' : 'QA Failed'}
            </span>
            {qaOverride && (
              <span className="text-[10px] text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.5 rounded">
                Override Active
              </span>
            )}
          </div>
          {report?.summary && (
            <p className="text-[10px] text-[#B0B0B0] mb-1">{report.summary}</p>
          )}
          {displayRunAt && (
            <p className="text-[10px] text-[#666666]">
              Last run: {new Date(displayRunAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Score breakdown */}
      {report && expanded && (
        <div className="mb-3 space-y-1.5">
          {Object.entries(CATEGORY_LABELS).map(([key, { label, maxScore }]) => {
            const score = (report.score_breakdown as unknown as Record<string, number>)[key] ?? 0;
            const pct = (score / maxScore) * 100;
            return (
              <div key={key}>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-[#888888]">{label}</span>
                  <span className="text-[#B0B0B0]">{Math.round(score)}/{maxScore}</span>
                </div>
                <div className="h-1.5 bg-[#1C1C1C] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, pct)}%`,
                      backgroundColor: pct >= 90 ? '#22C55E' : pct >= 70 ? '#F59E0B' : '#C0392B',
                    }}
                  />
                </div>
              </div>
            );
          })}

          {/* Stats row */}
          <div className="pt-2 mt-2 border-t border-[#333333] grid grid-cols-2 gap-1">
            <StatRow label="Unsupported claims" value={report.unsupported_claim_count} />
            <StatRow label="Citation coverage" value={`${report.citation_coverage_score ?? 0}/20`} />
            <StatRow label="Structural errors" value={report.structural_error_count} />
            <StatRow label="Editorial violations" value={report.editorial_violation_count} />
            <StatRow label="Numerical mismatches" value={report.numerical_mismatch_count} />
            <StatRow label="Reasoning flags" value={report.reasoning_flag_count} />
          </div>

          {/* Expandable finding sections */}
          {FINDING_SECTIONS.map(({ key, label }) => {
            const findings = (report as unknown as Record<string, FindingItem[]>)[key];
            if (!Array.isArray(findings) || findings.length === 0) return null;
            const isExpanded = expandedFindings.has(key);

            return (
              <div key={key} className="pt-2 mt-1 border-t border-[#333333]">
                <button
                  onClick={() => toggleFindingSection(key)}
                  className="w-full flex items-center justify-between text-[10px] text-[#888888] hover:text-white transition-colors"
                >
                  <span className="uppercase tracking-wider">
                    {label} ({findings.length})
                  </span>
                  <span>{isExpanded ? '\u25B2' : '\u25BC'}</span>
                </button>
                {isExpanded && (
                  <div className="mt-1.5 max-h-48 overflow-y-auto space-y-1">
                    {findings.map((f: FindingItem, i: number) => (
                      <div key={i} className="text-[10px] leading-tight p-1.5 bg-[#1C1C1C] rounded">
                        <div className="flex items-start gap-1">
                          <span
                            className="inline-block px-1 py-0.5 rounded text-[8px] font-bold shrink-0 mt-0.5"
                            style={{
                              backgroundColor: `${getSeverityColor(f.severity)}20`,
                              color: getSeverityColor(f.severity),
                            }}
                          >
                            {getSeverityLabel(f.severity)}
                          </span>
                          <div>
                            {(f.section || f.derivative) && (
                              <span className="text-[#B0B0B0]">{f.section || f.derivative}: </span>
                            )}
                            <span className="text-[#888888]">{f.message || f.claim_text}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Selected references */}
          {Array.isArray(report.selected_references) && report.selected_references.length > 0 && (
            <div className="pt-2 mt-1 border-t border-[#333333]">
              <button
                onClick={() => toggleFindingSection('references')}
                className="w-full flex items-center justify-between text-[10px] text-[#888888] hover:text-white transition-colors"
              >
                <span className="uppercase tracking-wider">
                  References ({(report.selected_references as unknown[]).length})
                </span>
                <span>{expandedFindings.has('references') ? '\u25B2' : '\u25BC'}</span>
              </button>
              {expandedFindings.has('references') && (
                <div className="mt-1.5 max-h-32 overflow-y-auto space-y-1">
                  {(report.selected_references as Array<{ source_label: string; source_url: string }>).map((ref, i) => (
                    <div key={i} className="text-[10px] leading-tight p-1 bg-[#1C1C1C] rounded">
                      <a
                        href={ref.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3B82F6] hover:underline"
                      >
                        {ref.source_label}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* QA Override form */}
      {!displayPassed && displayScore !== null && displayScore !== undefined && !qaOverride && (
        <div className="mb-2">
          {!showOverrideForm ? (
            <button
              onClick={() => setShowOverrideForm(true)}
              className="w-full py-1.5 text-[10px] text-[#F59E0B] hover:text-[#F59E0B]/80 transition-colors"
            >
              Override QA Gate
            </button>
          ) : (
            <div className="space-y-2 p-2 bg-[#1C1C1C] rounded">
              <p className="text-[10px] text-[#F59E0B]">
                Overriding QA allows publishing without passing QA. Provide a reason:
              </p>
              <textarea
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                placeholder="Reason for QA override..."
                className="w-full bg-[#222222] text-white text-[10px] p-2 rounded border border-[#333333] resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={submitOverride}
                  disabled={overriding || !overrideReason.trim()}
                  className="flex-1 py-1.5 text-[10px] font-semibold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 rounded hover:bg-[#F59E0B]/25 transition-colors disabled:opacity-50"
                >
                  {overriding ? 'Applying...' : 'Apply Override'}
                </button>
                <button
                  onClick={() => { setShowOverrideForm(false); setOverrideReason(''); }}
                  className="px-3 py-1.5 text-[10px] text-[#888888] hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={runQA}
          disabled={running}
          className="w-full py-2 text-xs font-semibold bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 rounded-lg hover:bg-[#3B82F6]/25 transition-colors disabled:opacity-50"
        >
          {running ? 'Running QA...' : 'Run QA Review'}
        </button>

        {!report && displayScore !== null && (
          <button
            onClick={loadReport}
            disabled={loadingReport}
            className="w-full py-1.5 text-[10px] text-[#888888] hover:text-white transition-colors"
          >
            {loadingReport ? 'Loading...' : 'View Last Report'}
          </button>
        )}

        {report && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full py-1.5 text-[10px] text-[#888888] hover:text-white transition-colors"
          >
            {expanded ? 'Hide Details' : 'Show Details'}
          </button>
        )}
      </div>

      {error && <p className="text-[#C0392B] text-[10px] mt-2">{error}</p>}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number | string | null | undefined }) {
  const numVal = typeof value === 'number' ? value : 0;
  const display = value ?? 0;
  return (
    <div className="flex justify-between text-[10px]">
      <span className="text-[#888888]">{label}</span>
      <span style={{ color: typeof value === 'number' && numVal > 0 ? '#F59E0B' : '#22C55E' }}>
        {display}
      </span>
    </div>
  );
}
