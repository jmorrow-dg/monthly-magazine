import type { IssueStatus } from '@/lib/types/issue';

/**
 * Valid status transitions for magazine issues.
 * Defines which statuses can transition to which other statuses.
 */
const VALID_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  draft: ['review'],
  review: ['draft', 'approved'],
  approved: ['review', 'published'],
  published: ['archived'],
  archived: ['published'],
};

/**
 * Check if a status transition is valid.
 */
export function isValidTransition(from: IssueStatus, to: IssueStatus): boolean {
  if (from === to) return true; // No-op is always valid
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get the list of valid next statuses from the current status.
 */
export function getValidNextStatuses(current: IssueStatus): IssueStatus[] {
  return VALID_TRANSITIONS[current] || [];
}

/**
 * Get a human-readable error message for an invalid transition.
 */
export function getTransitionError(from: IssueStatus, to: IssueStatus): string {
  const validNext = getValidNextStatuses(from);
  if (validNext.length === 0) {
    return `Cannot change status from "${from}".`;
  }
  return `Cannot transition from "${from}" to "${to}". Valid transitions: ${validNext.join(', ')}.`;
}
