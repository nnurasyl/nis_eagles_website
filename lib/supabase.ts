import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const isConfigured = Boolean(url?.startsWith('https://') && key && !url.includes('YOUR_PROJECT') && !key.includes('YOUR_PUBLISHABLE'));
// Only the publishable key goes in the browser. RLS enforces every database permission.
export const supabase = isConfigured ? createClient(url!, key!, {
  auth: {persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit'},
}) : null;
