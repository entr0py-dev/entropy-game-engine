import { createClient } from '@supabase/supabase-js';

// HARDCODED CREDENTIALS (Proven to work)
const supabaseUrl = "https://uyufenhltvwxypldaemj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dWZlbmhsdHZ3eHlwbGRhZW1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTYwNjUsImV4cCI6MjA3ODU3MjA2NX0.X4kJCvS6bK207thqCBpgcRTrV_n0N7k0kbAm9E_xdsc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false, // <--- CHANGED TO FALSE (Fixes iframe conflict)
        storageKey: 'entropy-auth-token'
    }
});
