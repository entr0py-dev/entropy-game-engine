import { createClient } from '@supabase/supabase-js';

// --- HARDCODED CREDENTIALS (TO BYPASS VERCEL VARIABLES) ---
const supabaseUrl = "https://uyufenhltvwxypldaemj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dWZlbmhsdHZ3eHlwbGRhZW1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTYwNjUsImV4cCI6MjA3ODU3MjA2NX0.X4kJCvS6bK207thqCBpgcRTrV_n0N7k0kbAm9E_xdsc";

// Debugging: This will show up in your console to PROVE the key is loaded
if (typeof window !== 'undefined') {
    console.log("✅ Supabase Client Initialized with Key starting:", supabaseAnonKey.substring(0, 10) + "...");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'entropy-auth-token' // Ensure this matches across your app
    }
});
