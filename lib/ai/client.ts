/**
 * Shared Anthropic client.
 * Single source of truth for all AI generation modules.
 *
 * Reads ANTHROPIC_API_KEY from process.env first, then falls back
 * to reading .env.local directly (workaround for Next.js 16 Turbopack
 * workspace root detection issues).
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

let _client: Anthropic | null = null;
let _resolvedKey: string | undefined;

function resolveApiKey(): string | undefined {
  if (_resolvedKey) return _resolvedKey;

  // Try process.env first (works in production)
  if (process.env.ANTHROPIC_API_KEY) {
    _resolvedKey = process.env.ANTHROPIC_API_KEY;
    return _resolvedKey;
  }

  // Fallback: read .env.local directly (dev workaround)
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf8');
    const match = envContent.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    if (match) {
      _resolvedKey = match[1].trim();
      return _resolvedKey;
    }
  } catch {
    // File not found or unreadable
  }

  return undefined;
}

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    const apiKey = resolveApiKey();
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export const AI_MODEL = 'claude-sonnet-4-20250514';
