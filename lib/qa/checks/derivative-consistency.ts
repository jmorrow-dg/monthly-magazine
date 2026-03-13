// ============================================================
// QA Check: Derivative Consistency (max 10 points)
// Ensures derivative artifacts do not introduce unsupported claims
// or contradict the main content.
// ============================================================

import type { QACheckInput, QACheckResult, QAViolation } from '../../types/qa';

/**
 * Checks derivative artifacts (executive_summary, beehiiv_summary,
 * welcome_email_snippet, linkedin_snippets) for consistency with
 * the main issue content. Only runs when derivatives exist.
 */
export function checkDerivativeConsistency(input: QACheckInput): QACheckResult {
  const violations: QAViolation[] = [];

  const hasDerivatives = !!(
    input.executive_summary ||
    input.beehiiv_summary ||
    input.welcome_email_snippet ||
    (input.linkedin_snippets && input.linkedin_snippets.length > 0)
  );

  // If no derivatives exist, award full points
  if (!hasDerivatives) {
    return {
      category: 'derivative_consistency',
      score: 10,
      max_score: 10,
      violations: [],
    };
  }

  // Build a set of key terms from main content for reference checking
  const mainContentTerms = extractKeyTerms(input);

  // Check each derivative for dash violations and basic consistency
  let penaltyPoints = 0;

  if (input.executive_summary) {
    const result = checkDerivativeText(
      input.executive_summary,
      'Executive Summary',
      'executive_summary',
      mainContentTerms,
    );
    violations.push(...result.violations);
    penaltyPoints += result.penalty;
  }

  if (input.beehiiv_summary) {
    const result = checkDerivativeText(
      input.beehiiv_summary,
      'Beehiiv Summary',
      'beehiiv_summary',
      mainContentTerms,
    );
    violations.push(...result.violations);
    penaltyPoints += result.penalty;
  }

  if (input.welcome_email_snippet) {
    const result = checkDerivativeText(
      input.welcome_email_snippet,
      'Welcome Email Snippet',
      'welcome_email_snippet',
      mainContentTerms,
    );
    violations.push(...result.violations);
    penaltyPoints += result.penalty;
  }

  if (input.linkedin_snippets && input.linkedin_snippets.length > 0) {
    for (let i = 0; i < input.linkedin_snippets.length; i++) {
      const snippet = input.linkedin_snippets[i];
      const textParts: string[] = [];
      if (typeof snippet.hook === 'string') textParts.push(snippet.hook);
      if (typeof snippet.body === 'string') textParts.push(snippet.body);
      if (typeof snippet.cta === 'string') textParts.push(snippet.cta);

      if (textParts.length > 0) {
        const result = checkDerivativeText(
          textParts.join(' '),
          `LinkedIn Snippet[${i}]`,
          'linkedin_snippets',
          mainContentTerms,
        );
        violations.push(...result.violations);
        penaltyPoints += result.penalty;
      }
    }
  }

  const score = Math.max(0, 10 - penaltyPoints);

  return {
    category: 'derivative_consistency',
    score: Math.round(score * 100) / 100,
    max_score: 10,
    violations,
  };
}

function checkDerivativeText(
  text: string,
  section: string,
  field: string,
  mainContentTerms: Set<string>,
): { violations: QAViolation[]; penalty: number } {
  const violations: QAViolation[] = [];
  let penalty = 0;

  // Check for dashes in derivatives
  const dashCount =
    (text.match(/\u2014/g)?.length || 0) +
    (text.match(/\u2013/g)?.length || 0) +
    (text.match(/ - /g)?.length || 0);

  if (dashCount > 0) {
    violations.push({
      check: 'derivative_consistency',
      severity: 'error',
      section,
      field,
      message: `Found ${dashCount} dash${dashCount > 1 ? 'es' : ''} in derivative content.`,
      suggestion: 'Regenerate derivatives or manually remove dashes.',
    });
    penalty += 1;
  }

  // Check if derivative is suspiciously long (may have hallucinated content)
  const wordCount = text.trim().split(/\s+/).length;
  if (field === 'executive_summary' && wordCount > 500) {
    violations.push({
      check: 'derivative_consistency',
      severity: 'warning',
      section,
      field,
      message: `Executive summary is ${wordCount} words, which may contain unsupported elaboration.`,
      suggestion: 'Review for accuracy and trim to essentials.',
    });
    penalty += 0.5;
  }

  if (field === 'beehiiv_summary' && wordCount > 300) {
    violations.push({
      check: 'derivative_consistency',
      severity: 'warning',
      section,
      field,
      message: `Beehiiv summary is ${wordCount} words, may exceed email format expectations.`,
      suggestion: 'Trim to under 300 words for email readability.',
    });
    penalty += 0.5;
  }

  // Check for company names or specific claims not in main content
  const derivativeTerms = extractTermsFromText(text);
  const novelTerms = [...derivativeTerms].filter(t => !mainContentTerms.has(t));

  // Only flag if there are many novel terms (suggests introduced content)
  if (novelTerms.length > 5) {
    violations.push({
      check: 'derivative_consistency',
      severity: 'info',
      section,
      field,
      message: `Derivative contains ${novelTerms.length} terms not found in main content. May include introduced claims.`,
      suggestion: 'Review derivative to ensure all claims are grounded in the main issue content.',
    });
    penalty += 0.5;
  }

  return { violations, penalty };
}

function extractKeyTerms(input: QACheckInput): Set<string> {
  const terms = new Set<string>();
  const allText: string[] = [];

  // Collect all main content text
  if (input.cover_story) {
    for (const val of Object.values(input.cover_story)) {
      if (typeof val === 'string') allText.push(val);
    }
  }

  const arraySections = [
    input.implications, input.enterprise, input.industry_watch,
    input.tools, input.playbooks, input.strategic_signals,
    input.briefing_prompts, input.executive_briefing,
  ];

  for (const items of arraySections) {
    for (const item of items) {
      for (const val of Object.values(item)) {
        if (typeof val === 'string') allText.push(val);
      }
    }
  }

  if (input.editorial_note) allText.push(input.editorial_note);
  if (input.why_this_matters) allText.push(input.why_this_matters);

  // Extract capitalised terms (company names, product names, etc.)
  for (const text of allText) {
    const extracted = extractTermsFromText(text);
    for (const term of extracted) {
      terms.add(term);
    }
  }

  return terms;
}

function extractTermsFromText(text: string): Set<string> {
  const terms = new Set<string>();
  // Match capitalised words that are likely proper nouns / company names
  const matches = text.match(/\b[A-Z][a-zA-Z]{2,}\b/g);
  if (matches) {
    for (const m of matches) {
      terms.add(m.toLowerCase());
    }
  }
  return terms;
}
