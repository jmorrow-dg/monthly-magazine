'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/admin');
      } else {
        const data = await res.json();
        setError(data.error || 'Authentication failed');
      }
    } catch {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#141414]">
      <div className="w-full max-w-sm mx-auto px-6">
        <div className="flex flex-col items-center mb-10">
          <Image
            src="/images/dg-logo.png"
            alt="David & Goliath"
            width={80}
            height={80}
            className="mb-6"
          />
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-white text-center">
            AI Intelligence Report
          </h1>
          <p className="text-[#888888] text-sm mt-2">
            David & Goliath Internal Tool
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              aria-label="Password"
              className="w-full px-4 py-3 bg-[#222222] border border-[#333333] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#B8860B] transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-[#C0392B] text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 bg-[#B8860B] text-[#141414] font-semibold rounded-lg hover:bg-[#D4A843] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Authenticating...' : 'Access'}
          </button>
        </form>

        <p className="text-[#666666] text-xs text-center mt-8">
          David & Goliath | AI Intelligence Publication
        </p>
      </div>
    </div>
  );
}
