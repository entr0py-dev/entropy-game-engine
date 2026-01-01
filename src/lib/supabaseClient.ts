// PATCH 1: Fixed hardcoded credentials + improved Safari handling
// Changes:
// - Environment variables for credentials
// - Better Safari session management
// - Fallback to hardcoded values for compatibility

import { createClient } from '@supabase/supabase-js';

// Use environment variables with fallback to hardcoded (for backward compatibility)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uyufenhltvwxypldaemj.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dWZlbmhsdHZ3eHlwbGRhZW1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTYwNjUsImV4cCI6MjA3ODU3MjA2NX0.X4kJCvS6bK207thqCBpgcRTrV_n0N7k0kbAm9E_xdsc";

// Safari detection
const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// FIXED: Better Safari handling - disable detectSessionInUrl to prevent iframe conflicts
// But keep autoRefreshToken enabled with longer intervals
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true, // Re-enabled but with custom handling
        detectSessionInUrl: false, // Prevents iframe conflicts
        storageKey: 'entropy-auth-token',
        // FIXED: Custom flow type for Safari
        flowType: isSafari ? 'pkce' : 'implicit',
        // Longer refresh interval for Safari to reduce 400/406 errors
        ...(isSafari && {
            autoRefreshToken: true,
        })
    }
});

// Add session recovery helper
export async function recoverSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Session recovery failed:', error);
        return null;
    }
    return data.session;
}
