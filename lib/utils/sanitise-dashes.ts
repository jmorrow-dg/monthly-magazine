/**
 * Removes em dashes (—), en dashes (–), and hyphens used as punctuation ( - )
 * from generated text. Preserves hyphens within compound words (e.g. "real-time").
 */
export function sanitiseDashes(text: string): string {
  return text
    .replace(/\u2014/g, ', ')   // em dash → comma
    .replace(/\u2013/g, ', ')   // en dash → comma
    .replace(/ - /g, ', ');     // spaced hyphen → comma
}

/**
 * Recursively sanitise all string values in a JSON-serialisable object.
 */
export function sanitiseDashesDeep<T>(value: T): T {
  if (typeof value === 'string') {
    return sanitiseDashes(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map(sanitiseDashesDeep) as T;
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = sanitiseDashesDeep(v);
    }
    return result as T;
  }
  return value;
}
