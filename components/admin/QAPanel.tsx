'use client';

import { useState } from 'react';
import type { QAReportRow } from '@/lib/types/qa';

interface QAPanelProps {
  issueId: string;
  qaScore: number | null;
  qaPassed: boolean | null;
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

function getScoreColor(score: number): string {
  if (score >= 95) return '#22C55E';  // green
  if (score >= 85) return '#F59E0B';  // amber
  return '#C0392B';                    // red
}

function getSeverityColor(severity: string): string {
  if (severity === 'error') return '#C0392B';
  if (severity === 'warning') return '#F59E0B';
  return '#3B82F6';
}

export default function QAPanel({ issueId, qaScore, qaPassed, lastQaRunAt, onQAComplete }: QAPanelProps) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<QAReportRow | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);

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

  const displayScore = report?.qa_score ?? qaScore;
  const displayPassed = report?.passed ?? qaPassed;
  const displayRunAt = report?.created_at ?? lastQaRunAt;

  return (
    <div className="bg-[#222222] border border-[#333333] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] text-[#888888] uppercase tracking-wider font-semibold">QA Review</h3>
        {displayScore !== null && (
          <span
            className="text-lg font-bold"
            style={{ color: getScoreColor(displayScore) }}
          >
            {displayScore}/100
          </span>
        )}
      </div>

      {/* Score summary */}
      {displayScore !== null && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: displayPassed ? '#22C55E' : '#C0392B' }}
            />
            <span className="text-xs" style={{ color: displayPassed ? '#22C55E' : '#C0392B' }}>
              {displayPassed ? 'QA Passed' : 'QA Failed'}
            </span>
          </div>
          {displayRunAt && (
            <p className="text-[10px] text-[#666666]">
              Last run: {new Date(displayRunAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Score breakdown (when report loaded) */}
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

          {/* Claim stats */}
          <div className="pt-2 mt-2 border-t border-[#333333] flex justify-between text-[10px]">
            <span className="text-[#888888]">Unsupported claims</span>
            <span style={{ color: report.unsupported_claim_count > 0 ? '#F59E0B' : '#22C55E' }}>
              {report.unsupported_claim_count}
            </span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-[#888888]">Citation coverage</span>
            <span className="text-[#B0B0B0]">{report.citation_coverage_pct}%</span>
          </div>

          {/* Violations */}
          {Array.isArray(report.violations) && report.violations.length > 0 && (
            <div className="pt-2 mt-2 border-t border-[#333333]">
              <p className="text-[10px] text-[#888888] uppercase tracking-wider mb-1.5">
                Violations ({report.violations.length})
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {(report.violations as Array<{ severity: string; section: string; message: string }>).map((v, i) => (
                  <div key={i} className="text-[10px] leading-tight p-1.5 bg-[#1C1C1C] rounded">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                      style={{ backgroundColor: getSeverityColor(v.severity) }}
                    />
                    <span className="text-[#B0B0B0]">{v.section}:</span>{' '}
                    <span className="text-[#888888]">{v.message}</span>
                  </div>
                ))}
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
