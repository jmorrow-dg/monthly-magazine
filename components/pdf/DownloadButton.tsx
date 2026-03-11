'use client';

import { useState } from 'react';

type DownloadButtonProps = {
  issueId: string;
  filename?: string;
};

export default function DownloadButton({ issueId, filename }: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/issues/${issueId}/pdf?download=true`, { method: 'POST' });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate PDF');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'dg-ai-report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="px-4 py-2 bg-[#222222] border border-[#333333] text-white text-sm font-medium rounded-lg hover:border-[#B8860B] disabled:opacity-50 transition-colors"
      >
        {loading ? 'Generating PDF...' : 'Download PDF'}
      </button>
      {error && <p className="text-[#C0392B] text-xs mt-2">{error}</p>}
    </div>
  );
}
