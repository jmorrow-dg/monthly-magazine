'use client';

import { useState } from 'react';

type DistributeButtonProps = {
  issueId: string;
};

export default function DistributeButton({ issueId }: DistributeButtonProps) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [error, setError] = useState('');

  async function handleDistribute() {
    if (!confirm('Send this issue to all active subscribers? This cannot be undone.')) return;

    setSending(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/issues/${issueId}/distribute`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Distribution failed');
      }

      const data = await res.json();
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Distribution failed');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleDistribute}
        disabled={sending}
        className="w-full py-2 text-xs font-semibold bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30 rounded-lg hover:bg-[#8B5CF6]/25 transition-colors disabled:opacity-50"
      >
        {sending ? 'Sending...' : 'Distribute via Email'}
      </button>

      {result && (
        <div className="text-[10px] text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 rounded px-3 py-2">
          Sent to {result.sent} subscriber{result.sent !== 1 ? 's' : ''}
          {result.failed > 0 && <span className="text-[#C0392B]"> ({result.failed} failed)</span>}
        </div>
      )}

      {error && (
        <div className="text-[10px] text-[#C0392B] bg-[#C0392B]/10 border border-[#C0392B]/20 rounded px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
}
