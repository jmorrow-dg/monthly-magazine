'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Subscriber } from '@/lib/supabase/subscriber-queries';

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [counts, setCounts] = useState<{ active: number; total: number }>({ active: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add form
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newCompanySize, setNewCompanySize] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAddProfile, setShowAddProfile] = useState(false);

  // CSV import
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; updated: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editCompanySize, setEditCompanySize] = useState('');

  const loadSubscribers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/subscribers?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setSubscribers(data.subscribers);
      setCounts(data.counts);
    } catch {
      setError('Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { loadSubscribers(); }, [loadSubscribers]);

  async function addSubscriber(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setAdding(true);
    setError('');

    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail.trim(),
          name: newName.trim() || undefined,
          role: newRole.trim() || undefined,
          industry: newIndustry.trim() || undefined,
          company_size: newCompanySize.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add subscriber');
      }

      setNewEmail('');
      setNewName('');
      setNewRole('');
      setNewIndustry('');
      setNewCompanySize('');
      setShowAddProfile(false);
      setSuccess('Subscriber added successfully');
      setTimeout(() => setSuccess(''), 3000);
      loadSubscribers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add subscriber');
    } finally {
      setAdding(false);
    }
  }

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError('');
    setImportResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));

      const emailIdx = headers.findIndex((h) => h === 'email' || h === 'email address' || h === 'e-mail');
      if (emailIdx === -1) throw new Error('CSV must have an "email" column');

      const nameIdx = headers.findIndex((h) => h === 'name' || h === 'full name' || h === 'full_name');
      const roleIdx = headers.findIndex((h) => h === 'role' || h === 'title' || h === 'job title' || h === 'job_title');
      const industryIdx = headers.findIndex((h) => h === 'industry' || h === 'sector');
      const sizeIdx = headers.findIndex((h) =>
        h === 'company_size' || h === 'company size' || h === 'size' || h === 'employees' || h === '# employees',
      );

      const parsedSubscribers = lines.slice(1).map((line) => {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        return {
          email: values[emailIdx] || '',
          name: nameIdx >= 0 ? values[nameIdx] || undefined : undefined,
          role: roleIdx >= 0 ? values[roleIdx] || undefined : undefined,
          industry: industryIdx >= 0 ? values[industryIdx] || undefined : undefined,
          company_size: sizeIdx >= 0 ? values[sizeIdx] || undefined : undefined,
        };
      }).filter((s) => s.email && s.email.includes('@'));

      if (parsedSubscribers.length === 0) throw new Error('No valid email addresses found in CSV');
      if (parsedSubscribers.length > 500) throw new Error('Maximum 500 subscribers per import');

      const res = await fetch('/api/subscribers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscribers: parsedSubscribers }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Import failed');
      }

      const data = await res.json();
      setImportResult(data);
      setSuccess(`Imported ${data.imported} new, updated ${data.updated} existing subscribers`);
      setTimeout(() => setSuccess(''), 5000);
      loadSubscribers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleUnsubscribe(id: string) {
    if (!confirm('Unsubscribe this person?')) return;
    try {
      const res = await fetch(`/api/subscribers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unsubscribe' }),
      });
      if (!res.ok) throw new Error('Failed');
      loadSubscribers();
    } catch {
      setError('Failed to unsubscribe');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Permanently delete this subscriber? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/subscribers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      loadSubscribers();
    } catch {
      setError('Failed to delete subscriber');
    }
  }

  function startEditing(sub: Subscriber) {
    setEditingId(sub.id);
    setEditRole(sub.role || '');
    setEditIndustry(sub.industry || '');
    setEditCompanySize(sub.company_size || '');
  }

  async function saveProfile(id: string) {
    try {
      const res = await fetch(`/api/subscribers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editRole || undefined,
          industry: editIndustry || undefined,
          company_size: editCompanySize || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setEditingId(null);
      loadSubscribers();
    } catch {
      setError('Failed to update profile');
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-white mb-1">
            Subscribers
          </h1>
          <p className="text-[#888888] text-sm">
            {counts.active} active of {counts.total} total subscribers
          </p>
        </div>

        {/* CSV Import */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleCsvImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="px-3 py-1.5 bg-[#222222] border border-[#333333] text-white text-xs rounded-lg hover:bg-[#2A2A2A] disabled:opacity-50 transition-colors"
          >
            {importing ? 'Importing...' : 'Import CSV'}
          </button>
        </div>
      </div>

      {error && <p className="text-[#C0392B] text-sm mb-4">{error}</p>}
      {success && <p className="text-[#22C55E] text-sm mb-4">{success}</p>}

      {importResult && importResult.errors.length > 0 && (
        <div className="bg-[#2A1A1A] border border-[#C0392B]/30 rounded-lg p-3 mb-4">
          <p className="text-[#C0392B] text-xs font-semibold mb-1">Import Errors ({importResult.errors.length})</p>
          <div className="max-h-24 overflow-y-auto">
            {importResult.errors.slice(0, 10).map((err, i) => (
              <p key={i} className="text-[#888888] text-xs">{err}</p>
            ))}
            {importResult.errors.length > 10 && (
              <p className="text-[#888888] text-xs">...and {importResult.errors.length - 10} more</p>
            )}
          </div>
        </div>
      )}

      {/* Add subscriber form */}
      <form onSubmit={addSubscriber} className="bg-[#222222] border border-[#333333] rounded-lg p-4 mb-6">
        <h3 className="text-[11px] text-[#888888] uppercase tracking-wider font-semibold mb-3">Add Subscriber</h3>
        <div className="flex flex-col sm:flex-row gap-3 mb-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@example.com"
            required
            className="flex-1 px-3 py-2 bg-[#1C1C1C] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B] placeholder-[#555555]"
          />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name (optional)"
            className="flex-1 px-3 py-2 bg-[#1C1C1C] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B] placeholder-[#555555]"
          />
          <button
            type="button"
            onClick={() => setShowAddProfile(!showAddProfile)}
            className="px-3 py-2 text-[#B8860B] text-xs hover:text-[#D4A843] transition-colors whitespace-nowrap"
          >
            {showAddProfile ? 'Hide profile' : '+ Profile'}
          </button>
          <button
            type="submit"
            disabled={adding || !newEmail.trim()}
            className="px-4 py-2 bg-[#B8860B] text-white text-sm font-semibold rounded-lg hover:bg-[#D4A843] disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>
        {showAddProfile && (
          <div className="flex flex-col sm:flex-row gap-3 mt-2 pt-2 border-t border-[#333333]">
            <input
              type="text"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="Role (e.g. CEO, CTO)"
              className="flex-1 px-3 py-2 bg-[#1C1C1C] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B] placeholder-[#555555]"
            />
            <input
              type="text"
              value={newIndustry}
              onChange={(e) => setNewIndustry(e.target.value)}
              placeholder="Industry (e.g. Finance)"
              className="flex-1 px-3 py-2 bg-[#1C1C1C] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B] placeholder-[#555555]"
            />
            <input
              type="text"
              value={newCompanySize}
              onChange={(e) => setNewCompanySize(e.target.value)}
              placeholder="Company size (e.g. 50-200)"
              className="flex-1 px-3 py-2 bg-[#1C1C1C] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B] placeholder-[#555555]"
            />
          </div>
        )}
      </form>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or name..."
          className="flex-1 px-3 py-2 bg-[#222222] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B] placeholder-[#555555]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-[#222222] border border-[#333333] rounded text-white text-sm focus:outline-none focus:border-[#B8860B]"
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
      </div>

      {/* CSV format hint */}
      <p className="text-[#555555] text-[10px] mb-4">
        CSV columns: email (required), name, role/title, industry/sector, company_size/employees
      </p>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-[#222222] animate-pulse rounded" />
          ))}
        </div>
      ) : subscribers.length === 0 ? (
        <div className="text-center py-12 text-[#666666]">
          <p className="text-sm">No subscribers found</p>
        </div>
      ) : (
        <div className="bg-[#222222] border border-[#333333] rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-[#333333]">
                <th className="text-left px-4 py-3 text-[10px] text-[#888888] uppercase tracking-wider font-semibold">Email</th>
                <th className="text-left px-4 py-3 text-[10px] text-[#888888] uppercase tracking-wider font-semibold">Name</th>
                <th className="text-left px-4 py-3 text-[10px] text-[#888888] uppercase tracking-wider font-semibold">Role</th>
                <th className="text-left px-4 py-3 text-[10px] text-[#888888] uppercase tracking-wider font-semibold">Industry</th>
                <th className="text-left px-4 py-3 text-[10px] text-[#888888] uppercase tracking-wider font-semibold">Size</th>
                <th className="text-left px-4 py-3 text-[10px] text-[#888888] uppercase tracking-wider font-semibold">Status</th>
                <th className="text-right px-4 py-3 text-[10px] text-[#888888] uppercase tracking-wider font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((sub) => (
                <tr key={sub.id} className="border-b border-[#333333] last:border-b-0 hover:bg-[#1C1C1C] transition-colors">
                  <td className="px-4 py-3 text-sm text-white">{sub.email}</td>
                  <td className="px-4 py-3 text-sm text-[#B0B0B0]">{sub.name || '-'}</td>

                  {editingId === sub.id ? (
                    <>
                      <td className="px-4 py-1">
                        <input
                          type="text"
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          placeholder="Role"
                          className="w-full px-2 py-1 bg-[#1C1C1C] border border-[#444444] rounded text-white text-xs focus:outline-none focus:border-[#B8860B]"
                        />
                      </td>
                      <td className="px-4 py-1">
                        <input
                          type="text"
                          value={editIndustry}
                          onChange={(e) => setEditIndustry(e.target.value)}
                          placeholder="Industry"
                          className="w-full px-2 py-1 bg-[#1C1C1C] border border-[#444444] rounded text-white text-xs focus:outline-none focus:border-[#B8860B]"
                        />
                      </td>
                      <td className="px-4 py-1">
                        <input
                          type="text"
                          value={editCompanySize}
                          onChange={(e) => setEditCompanySize(e.target.value)}
                          placeholder="Size"
                          className="w-full px-2 py-1 bg-[#1C1C1C] border border-[#444444] rounded text-white text-xs focus:outline-none focus:border-[#B8860B]"
                        />
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-xs text-[#888888]">{sub.role || '-'}</td>
                      <td className="px-4 py-3 text-xs text-[#888888]">{sub.industry || '-'}</td>
                      <td className="px-4 py-3 text-xs text-[#888888]">{sub.company_size || '-'}</td>
                    </>
                  )}

                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      sub.status === 'active'
                        ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20'
                        : 'bg-[#666666]/10 text-[#666666] border border-[#666666]/20'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {editingId === sub.id ? (
                        <>
                          <button
                            onClick={() => saveProfile(sub.id)}
                            className="text-[10px] text-[#22C55E] hover:text-green-400 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-[10px] text-[#888888] hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(sub)}
                            className="text-[10px] text-[#B8860B] hover:text-[#D4A843] transition-colors"
                          >
                            Edit
                          </button>
                          {sub.status === 'active' && (
                            <button
                              onClick={() => handleUnsubscribe(sub.id)}
                              className="text-[10px] text-[#888888] hover:text-white transition-colors"
                            >
                              Unsub
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(sub.id)}
                            className="text-[10px] text-[#C0392B] hover:text-red-400 transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
