// Supabase Realtime keeps the phones of one table in sync. Without these two variables the app
// still runs, but only the solo practice mode is available (see README).
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';

export const hasBackend = SUPABASE_URL !== '' && SUPABASE_KEY !== '';
