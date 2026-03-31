import { getSupabase } from './client';

export type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  industry: string | null;
  company_size: string | null;
  status: 'active' | 'unsubscribed';
  subscribed_at: string;
  unsubscribed_at: string | null;
};

export type CreateSubscriberInput = {
  email: string;
  name?: string | null;
  role?: string | null;
  industry?: string | null;
  company_size?: string | null;
};

/**
 * Build insert/update payload with only columns that exist in the DB.
 * The subscribers table may not have all optional profile columns yet.
 */
async function getTableColumns(): Promise<Set<string>> {
  const supabase = getSupabase();
  // Fetch a single row (or empty) to discover available columns
  const { data } = await supabase.from('subscribers').select('*').limit(1);
  if (data && data.length > 0) return new Set(Object.keys(data[0]));
  // If no rows, try an insert-select to discover columns from the schema
  // Fall back to the minimal known set
  return new Set(['id', 'email', 'name', 'status', 'subscribed_at', 'unsubscribed_at']);
}

function pickFields(obj: Record<string, unknown>, columns: Set<string>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (columns.has(key)) result[key] = val;
  }
  return result;
}

export async function createSubscriber(input: CreateSubscriberInput): Promise<Subscriber> {
  const supabase = getSupabase();
  const columns = await getTableColumns();

  const { data: existing } = await supabase
    .from('subscribers')
    .select('*')
    .eq('email', input.email.toLowerCase().trim())
    .single();

  if (existing) {
    if (existing.status === 'unsubscribed') {
      const updatePayload = pickFields({
        status: 'active',
        unsubscribed_at: null,
        name: input.name || existing.name,
        role: input.role || existing.role,
        industry: input.industry || existing.industry,
        company_size: input.company_size || existing.company_size,
      }, columns);
      const { data, error } = await supabase
        .from('subscribers')
        .update(updatePayload)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw new Error(`Failed to reactivate subscriber: ${error.message}`);
      return data as Subscriber;
    }
    throw new Error('Email is already subscribed');
  }

  const insertPayload = pickFields({
    email: input.email.toLowerCase().trim(),
    name: input.name || null,
    role: input.role || null,
    industry: input.industry || null,
    company_size: input.company_size || null,
  }, columns);
  // email is always required
  insertPayload.email = input.email.toLowerCase().trim();

  const { data, error } = await supabase
    .from('subscribers')
    .insert(insertPayload)
    .select()
    .single();

  if (error) throw new Error(`Failed to create subscriber: ${error.message}`);
  return data as Subscriber;
}

export async function listSubscribers(opts?: { status?: string; search?: string }): Promise<Subscriber[]> {
  const supabase = getSupabase();
  let query = supabase
    .from('subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false });

  if (opts?.status) {
    query = query.eq('status', opts.status);
  }

  if (opts?.search) {
    query = query.or(`email.ilike.%${opts.search}%,name.ilike.%${opts.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list subscribers: ${error.message}`);
  return (data || []) as Subscriber[];
}

export async function getActiveSubscribers(): Promise<Subscriber[]> {
  return listSubscribers({ status: 'active' });
}

export async function updateSubscriberProfile(
  id: string,
  profile: { role?: string | null; industry?: string | null; company_size?: string | null },
): Promise<Subscriber> {
  const supabase = getSupabase();
  const columns = await getTableColumns();
  const safeProfile = pickFields(profile as Record<string, unknown>, columns);

  const { data, error } = await supabase
    .from('subscribers')
    .update(safeProfile)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update subscriber profile: ${error.message}`);
  return data as Subscriber;
}

export async function bulkUpsertSubscribers(
  subscribers: CreateSubscriberInput[],
): Promise<{ imported: number; updated: number; errors: string[] }> {
  const supabase = getSupabase();
  const columns = await getTableColumns();
  const result = { imported: 0, updated: 0, errors: [] as string[] };

  for (const sub of subscribers) {
    const email = sub.email.toLowerCase().trim();
    try {
      const { data: existing } = await supabase
        .from('subscribers')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) {
        const rawUpdates: Record<string, string | null | undefined> = {};
        if (sub.name) rawUpdates.name = sub.name;
        if (sub.role) rawUpdates.role = sub.role;
        if (sub.industry) rawUpdates.industry = sub.industry;
        if (sub.company_size) rawUpdates.company_size = sub.company_size;

        const updates = pickFields(rawUpdates as Record<string, unknown>, columns);
        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from('subscribers')
            .update(updates)
            .eq('id', existing.id);
          if (error) throw error;
        }
        result.updated++;
      } else {
        const insertPayload = pickFields({
          email,
          name: sub.name || null,
          role: sub.role || null,
          industry: sub.industry || null,
          company_size: sub.company_size || null,
        }, columns);
        insertPayload.email = email;

        const { error } = await supabase
          .from('subscribers')
          .insert(insertPayload);
        if (error) throw error;
        result.imported++;
      }
    } catch (err) {
      result.errors.push(`${email}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return result;
}

export async function unsubscribe(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(`Failed to unsubscribe: ${error.message}`);
}

export async function deleteSubscriber(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('subscribers').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete subscriber: ${error.message}`);
}

export async function getSubscriberCount(): Promise<{ active: number; total: number }> {
  const supabase = getSupabase();
  const { count: total, error: totalErr } = await supabase
    .from('subscribers')
    .select('*', { count: 'exact', head: true });

  const { count: active, error: activeErr } = await supabase
    .from('subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  if (totalErr || activeErr) throw new Error('Failed to count subscribers');
  return { active: active || 0, total: total || 0 };
}
