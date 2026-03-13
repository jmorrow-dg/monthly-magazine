// ============================================================
// QA: Derivative Consistency Check (max 10 points)
// Ensures derivative artifacts (executive summary, beehiiv,
// email snippet, LinkedIn) don't introduce unsupported claims.
// ============================================================

import type {
  QACheckInput,
  QACheckResult,
  DerivativeConsistencyFinding,
  ExtractedSection,
} from '../types/qa';
import { extractIssueSections, getCoreContentSections, getDerivativeSections } from './extract-issue-sections';

/**
 * Check that derivative content does not introduce claims
 * or entities absent from the core issue content.
 */
export function runDerivativeConsistencyCheck(input: QACheckInput): QACheckResult {
  const findings: DerivativeConsistencyFinding[] = [];
  const sections = extractIssueSections(input);
  const coreSections = getCoreContentSections(sections);
  const derivativeSections = getDerivativeSections(sections);

  // If no derivatives exist, full marks
  if (derivativeSections.length === 0) {
    return {
      category: 'derivative_consistency',
      score: 10,
      max_score: 10,
      derivative_consistency_findings: [],
    };
  }

  // Build a combined text corpus from core content for reference
  const coreText = coreSections.map(s => s.raw_text).join(' ').toLowerCase();
  const coreTokens = new Set(
    coreText.split(/\W+/).filter(t => t.length > 3 && !STOP_WORDS.has(t)),
  );

  // Extract company names and entities from core content
  const coreEntities = extractEntities(coreText);

  for (const derivative of derivativeSections) {
    // Check for novel entities not present in core content
    const novelEntities = checkNovelEntities(derivative, coreEntities);
    if (novelEntities.length > 0) {
      findings.push({
        derivative: derivative.section_label,
        finding_type: 'novel_entity',
        message: `Introduces entities not found in core content: ${novelEntities.slice(0, 5).join(', ')}${novelEntities.length > 5 ? '...' : ''}`,
        severity: novelEntities.length > 3 ? 'warning' : 'info',
      });
    }

    // Check for novel statistics not present in core content
    const novelStats = checkNovelStatistics(derivative, coreSections);
    if (novelStats.length > 0) {
      findings.push({
        derivative: derivative.section_label,
        finding_type: 'novel_statistic',
        message: `Contains statistics not found in core content: ${novelStats.slice(0, 3).join(', ')}`,
        severity: 'warning',
      });
    }

    // Check for significant token divergence (derivative talks about something core doesn't)
    const divergence = checkTokenDivergence(derivative, coreTokens);
    if (divergence > 0.4) {
      findings.push({
        derivative: derivative.section_label,
        finding_type: 'topic_divergence',
        message: `Significant topic divergence from core content (${Math.round(divergence * 100)}% novel tokens). Derivative may be introducing unsupported themes.`,
        severity: divergence > 0.6 ? 'warning' : 'info',
      });
    }

    // Check word count isn't disproportionate
    const wordCount = derivative.raw_text.split(/\s+/).length;
    if (derivative.section_key === 'linkedin_snippets' && wordCount > 600) {
      findings.push({
        derivative: derivative.section_label,
        finding_type: 'length_issue',
        message: `LinkedIn snippets total ${wordCount} words, which may be excessive.`,
        severity: 'info',
      });
    }
  }

  // Score calculation
  const errorCount = findings.filter(f => f.severity === 'error').length;
  const warningCount = findings.filter(f => f.severity === 'warning').length;
  let score = 10 - errorCount * 3 - warningCount * 1;

  return {
    category: 'derivative_consistency',
    score: Math.max(0, Math.min(10, Math.round(score * 100) / 100)),
    max_score: 10,
    derivative_consistency_findings: findings,
  };
}

/**
 * Find capitalised entity names in derivative that are absent from core.
 */
function checkNovelEntities(
  derivative: ExtractedSection,
  coreEntities: Set<string>,
): string[] {
  const derivEntities = derivative.raw_text.match(/\b[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*\b/g);
  if (!derivEntities) return [];

  const novel: string[] = [];
  for (const entity of new Set(derivEntities)) {
    const lower = entity.toLowerCase();
    if (SKIP_WORDS.has(lower)) continue;
    if (lower.length < 3) continue;
    if (!coreEntities.has(lower)) {
      novel.push(entity);
    }
  }
  return novel;
}

/**
 * Find statistics (percentages, dollar amounts, multipliers) in derivative
 * that don't appear in core content.
 */
function checkNovelStatistics(
  derivative: ExtractedSection,
  coreSections: ExtractedSection[],
): string[] {
  const statPatterns = [
    /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*%/g,
    /\$\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*(?:billion|million|trillion|B|M|T|bn|mn)?/gi,
    /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*(?:billion|million|trillion|B|M|T|bn|mn)/gi,
    /\b\d+x\b/gi,
  ];

  const coreStats = new Set<string>();
  for (const section of coreSections) {
    for (const pattern of statPatterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(section.raw_text)) !== null) {
        coreStats.add(normaliseStatistic(match[0]));
      }
    }
  }

  const novelStats: string[] = [];
  for (const pattern of statPatterns) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(derivative.raw_text)) !== null) {
      const normalised = normaliseStatistic(match[0]);
      if (!coreStats.has(normalised)) {
        novelStats.push(match[0]);
      }
    }
  }

  return novelStats;
}

/**
 * Calculate what fraction of derivative tokens are absent from core.
 */
function checkTokenDivergence(
  derivative: ExtractedSection,
  coreTokens: Set<string>,
): number {
  const derivTokens = derivative.raw_text
    .toLowerCase()
    .split(/\W+/)
    .filter(t => t.length > 3 && !STOP_WORDS.has(t));

  if (derivTokens.length === 0) return 0;

  const novelCount = derivTokens.filter(t => !coreTokens.has(t)).length;
  return novelCount / derivTokens.length;
}

function extractEntities(text: string): Set<string> {
  const matches = text.match(/\b[a-z]{3,}\b/g) || [];
  return new Set(matches.filter(m => !STOP_WORDS.has(m)));
}

function normaliseStatistic(stat: string): string {
  return stat.trim().toLowerCase().replace(/,/g, '').replace(/\s+/g, '');
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
  'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'this', 'that',
  'with', 'will', 'from', 'they', 'were', 'more', 'when', 'than', 'what',
  'also', 'into', 'most', 'its', 'over', 'such', 'very', 'just', 'about',
  'which', 'their', 'would', 'there', 'could', 'other', 'these', 'where',
  'being', 'each', 'some', 'them', 'then', 'does', 'should',
]);

const SKIP_WORDS = new Set([
  'the', 'this', 'that', 'these', 'those', 'what', 'which', 'where', 'when',
  'how', 'why', 'who', 'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'strategic', 'enterprise', 'industry', 'global', 'regional', 'national',
  'implications', 'analysis', 'introduction', 'conclusion',
  'cover', 'story', 'editorial', 'briefing', 'report', 'intelligence',
]);
