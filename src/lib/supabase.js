import { createClient } from "@supabase/supabase-js";

// This is the publishable (public) key, which is safe to ship inside the app.
// Your data is protected by the Row Level Security rules in supabase/schema.sql.
const SUPABASE_URL = "https://qchzxdtyvetmpkcnnkmv.supabase.co";
const SUPABASE_KEY = "sb_publishable_eskM9c3qzxiM9lXsp-M25w_-t0Enr4L";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});
