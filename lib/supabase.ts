import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Null when Supabase is not configured; the app then runs in demo mode only. */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;
