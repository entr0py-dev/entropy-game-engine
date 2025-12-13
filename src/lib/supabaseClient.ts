import { createClient } from '@supabase/supabase-js';

// HARDCODED CREDENTIALS (Proven to work)
const supabaseUrl = "https://uyufenhltvwxypldaemj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dWZlbmhsdHZ3eHlwbGRhZW1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTYwNjUsImV4cCI6MjA3ODU3MjA2NX0.X4kJCvS6bK207thqCBpgcRTrV_n0N7k0kbAm9E_xdsc";

// Safari (especially embedded) can reject storage/refresh and cause Supabase to hammer auth with 400/406 loops.
const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: !isSafari, // disable background refresh on Safari to prevent infinite 400/406 retries
        detectSessionInUrl: false, // <--- CHANGED TO FALSE (Fixes iframe conflict)
        storageKey: 'entropy-auth-token'
    }
});
